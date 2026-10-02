<?php

it('adds, lists and removes wishlist items', function () {
    $product = productWithStock();
    $user = actingAsCustomer();

    $this->postJson("/api/v1/wishlist/{$product->id}")->assertCreated();
    $this->postJson("/api/v1/wishlist/{$product->id}")->assertCreated(); // idempotent

    $this->getJson('/api/v1/wishlist')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.is_wishlisted', true);

    $this->deleteJson("/api/v1/wishlist/{$product->id}")->assertOk();

    expect($user->wishlist()->count())->toBe(0);
});
