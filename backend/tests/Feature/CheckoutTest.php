<?php

use App\Enums\OrderStatus;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;

function checkoutPayload(\App\Models\Product $product, int $qty = 1, array $extra = []): array
{
    return [
        'items' => [['variant_id' => $product->variants->first()->id, 'quantity' => $qty]],
        'shipping_address' => shippingAddress(),
    ] + $extra;
}

it('creates a pending order, reserves stock and returns a client secret', function () {
    $product = productWithStock(5, 3000);
    $user = actingAsCustomer();

    $response = $this->postJson('/api/v1/checkout', checkoutPayload($product, 2))
        ->assertCreated()
        ->assertJsonPath('data.order.status', 'pending')
        ->assertJsonPath('data.order.subtotal', 6000)
        ->assertJsonStructure(['data' => ['client_secret', 'order' => ['number', 'items']]]);

    expect($product->variants->first()->fresh()->stock)->toBe(3);

    $order = Order::query()->where('number', $response->json('data.order.number'))->firstOrFail();
    expect($order->user_id)->toBe($user->id)
        ->and($order->payments)->toHaveCount(1)
        ->and($order->items->first()->product_name)->toBe($product->name)
        ->and($order->shipping_address['city'])->toBe('New York');
});

it('never trusts prices from the client', function () {
    $product = productWithStock(5, 3000);
    actingAsCustomer();

    $payload = checkoutPayload($product);
    $payload['items'][0]['price'] = 1; // ignored

    $this->postJson('/api/v1/checkout', $payload)->assertCreated()->assertJsonPath('data.order.subtotal', 3000);
});

it('does not create an order when stock is insufficient', function () {
    $product = productWithStock(1);
    actingAsCustomer();

    $this->postJson('/api/v1/checkout', checkoutPayload($product, 2))->assertUnprocessable();

    expect(Order::count())->toBe(0);
});

it('redeems a coupon exactly once per user when limited', function () {
    $product = productWithStock(10, 10000);
    Coupon::factory()->percent(10)->create(['code' => 'ONCE', 'per_user_limit' => 1]);
    actingAsCustomer();

    $this->postJson('/api/v1/checkout', checkoutPayload($product, 1, ['coupon_code' => 'ONCE']))
        ->assertCreated()
        ->assertJsonPath('data.order.discount_total', 1000);

    $this->postJson('/api/v1/checkout', checkoutPayload($product, 1, ['coupon_code' => 'ONCE']))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'invalid_coupon');

    expect(Coupon::query()->where('code', 'ONCE')->value('used_count'))->toBe(1);
});

it('requires a shipping address', function () {
    $product = productWithStock();
    actingAsCustomer();

    $this->postJson('/api/v1/checkout', ['items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 1]]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['shipping_address']);
});

it('lets the customer cancel an unpaid order and restocks it', function () {
    $product = productWithStock(5);
    actingAsCustomer();

    $number = $this->postJson('/api/v1/checkout', checkoutPayload($product, 3))->json('data.order.number');

    $this->postJson("/api/v1/orders/{$number}/cancel")
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    expect($product->variants->first()->fresh()->stock)->toBe(5);
});

it('lists only the customer\'s own orders', function () {
    $user = actingAsCustomer();
    Order::factory(2)->for($user)->create();
    Order::factory()->create();

    $this->getJson('/api/v1/orders')->assertOk()->assertJsonCount(2, 'data');
});

it('forbids viewing another customer\'s order', function () {
    $order = Order::factory()->for(User::factory())->create();
    actingAsCustomer();

    $this->getJson("/api/v1/orders/{$order->number}")
        ->assertForbidden()
        ->assertJsonPath('code', 'forbidden');
});

it('can simulate payment with the fake gateway', function () {
    $product = productWithStock(5);
    actingAsCustomer();
    $number = $this->postJson('/api/v1/checkout', checkoutPayload($product))->json('data.order.number');

    $this->postJson("/api/v1/orders/{$number}/simulate-payment")
        ->assertOk()
        ->assertJsonPath('data.status', OrderStatus::Paid->value);
});
