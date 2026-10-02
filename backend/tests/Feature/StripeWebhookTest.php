<?php

use App\Enums\OrderStatus;
use App\Models\Order;

function placeOrder(int $stock = 5, int $price = 3000): Order
{
    $product = productWithStock($stock, $price);
    actingAsCustomer();

    $number = test()->postJson('/api/v1/checkout', [
        'items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 1]],
        'shipping_address' => shippingAddress(),
    ])->assertCreated()->json('data.order.number');

    return Order::query()->where('number', $number)->with('payments')->firstOrFail();
}

function postWebhook(string $payload, string $signature)
{
    return test()->call('POST', '/api/v1/webhooks/stripe', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => $signature,
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
    ], $payload);
}

it('marks the order paid on payment_intent.succeeded', function () {
    $order = placeOrder();
    $payment = $order->payments->first();

    [$payload, $signature] = stripeWebhook('payment_intent.succeeded', [
        'id' => $payment->provider_payment_id,
        'amount' => $order->total,
        'amount_received' => $order->total,
    ]);

    postWebhook($payload, $signature)->assertOk()->assertJsonPath('result', 'paid');

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Paid)
        ->and($order->paid_at)->not->toBeNull()
        ->and($order->items->first()->product->sold_count)->toBe(1);
});

it('processes each event only once (idempotency)', function () {
    $order = placeOrder();
    $payment = $order->payments->first();
    [$payload, $signature] = stripeWebhook('payment_intent.succeeded', [
        'id' => $payment->provider_payment_id,
        'amount_received' => $order->total,
    ], 'evt_same');

    postWebhook($payload, $signature)->assertJsonPath('result', 'paid');
    postWebhook($payload, $signature)->assertJsonPath('result', 'duplicate');

    expect($order->items->first()->product->fresh()->sold_count)->toBe(1);
});

it('rejects an invalid signature', function () {
    [$payload] = stripeWebhook('payment_intent.succeeded', ['id' => 'pi_x']);

    postWebhook($payload, 't='.time().',v1=forged')
        ->assertStatus(400)
        ->assertJsonPath('code', 'invalid_signature');
});

it('does not mark paid when the amount received is too low', function () {
    $order = placeOrder();
    [$payload, $signature] = stripeWebhook('payment_intent.succeeded', [
        'id' => $order->payments->first()->provider_payment_id,
        'amount_received' => 1,
    ]);

    postWebhook($payload, $signature)->assertJsonPath('result', 'amount_mismatch');

    expect($order->fresh()->status)->toBe(OrderStatus::Pending);
});

it('records failed payments but keeps the order payable', function () {
    $order = placeOrder();
    [$payload, $signature] = stripeWebhook('payment_intent.payment_failed', [
        'id' => $order->payments->first()->provider_payment_id,
    ]);

    postWebhook($payload, $signature)->assertJsonPath('result', 'failed');

    expect($order->fresh()->status)->toBe(OrderStatus::Pending);
});
