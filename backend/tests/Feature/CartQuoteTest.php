<?php

use App\Models\Coupon;

it('prices a cart on the server with shipping', function () {
    config(['store.shipping.flat' => 799, 'store.shipping.free_over' => 15000]);
    $product = productWithStock(10, 2500);

    $this->postJson('/api/v1/cart/quote', [
        'items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 2]],
    ])
        ->assertOk()
        ->assertJsonPath('data.subtotal', 5000)
        ->assertJsonPath('data.shipping', 799)
        ->assertJsonPath('data.total', 5799);
});

it('gives free shipping above the threshold', function () {
    config(['store.shipping.free_over' => 15000]);
    $product = productWithStock(10, 16000);

    $this->postJson('/api/v1/cart/quote', ['items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 1]]])
        ->assertOk()
        ->assertJsonPath('data.shipping', 0);
});

it('applies a percentage coupon capped by max_discount', function () {
    config(['store.shipping.free_over' => 0]);
    $product = productWithStock(10, 50000);
    Coupon::factory()->percent(50)->create(['code' => 'HALF', 'max_discount' => 10000]);

    $this->postJson('/api/v1/cart/quote', [
        'items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 1]],
        'coupon_code' => 'half',
    ])
        ->assertOk()
        ->assertJsonPath('data.discount', 10000)
        ->assertJsonPath('data.coupon.code', 'HALF');
});

it('rejects an expired coupon', function () {
    $product = productWithStock();
    Coupon::factory()->expired()->create(['code' => 'OLD']);

    $this->postJson('/api/v1/cart/quote', [
        'items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 1]],
        'coupon_code' => 'OLD',
    ])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'invalid_coupon')
        ->assertJsonPath('errors.coupon_code.0', 'This coupon has expired.');
});

it('enforces the coupon minimum order amount', function () {
    $product = productWithStock(10, 1000);
    Coupon::factory()->fixed(500)->create(['code' => 'MIN', 'min_order_amount' => 5000]);

    $this->postJson('/api/v1/cart/quote', [
        'items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 1]],
        'coupon_code' => 'MIN',
    ])->assertUnprocessable()->assertJsonPath('code', 'invalid_coupon');
});

it('refuses quantities above available stock', function () {
    $product = productWithStock(2);

    $this->postJson('/api/v1/cart/quote', ['items' => [['variant_id' => $product->variants->first()->id, 'quantity' => 3]]])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'out_of_stock');
});
