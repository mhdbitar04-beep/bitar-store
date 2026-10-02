<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\Payments\PaymentGateway;

it('lists and filters orders', function () {
    actingAsAdmin();
    Order::factory(2)->status(OrderStatus::Paid)->create();
    Order::factory()->status(OrderStatus::Shipped)->create();

    $this->getJson('/api/v1/admin/orders?status=paid')->assertOk()->assertJsonCount(2, 'data');
});

it('moves an order through a valid transition and records history', function () {
    $admin = actingAsAdmin();
    $order = Order::factory()->status(OrderStatus::Paid)->create();

    $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'processing', 'note' => 'Packing'])
        ->assertOk()
        ->assertJsonPath('data.status', 'processing')
        ->assertJsonPath('data.history.0.to_status', 'processing');

    expect($order->statusHistories()->first()->changed_by)->toBe($admin->id);
});

it('rejects an invalid transition', function () {
    actingAsAdmin();
    $order = Order::factory()->status(OrderStatus::Delivered)->create();

    $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'pending'])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'invalid_status_transition');
});

it('refunds through the payment gateway', function () {
    actingAsAdmin();
    $order = Order::factory()->status(OrderStatus::Paid)->create();
    $order->payments()->create([
        'provider' => 'fake',
        'provider_payment_id' => 'pi_123',
        'amount' => $order->total,
        'currency' => 'usd',
        'status' => PaymentStatus::Succeeded,
    ]);

    $this->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'refunded'])->assertOk();

    expect(app(PaymentGateway::class)->refunds)->toHaveCount(1)
        ->and($order->payments()->first()->status)->toBe(PaymentStatus::Refunded);
});

it('returns dashboard analytics', function () {
    actingAsAdmin();
    Order::factory(3)->status(OrderStatus::Delivered)->create(['total' => 10000]);

    $this->getJson('/api/v1/admin/dashboard?days=7')
        ->assertOk()
        ->assertJsonPath('data.kpis.revenue', 30000)
        ->assertJsonPath('data.kpis.orders', 3)
        ->assertJsonCount(7, 'data.sales_over_time')
        ->assertJsonStructure(['data' => ['top_products', 'orders_by_status']]);
});
