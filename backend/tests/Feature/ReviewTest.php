<?php

it('lets a customer review a product and updates the cached rating', function () {
    $product = productWithStock();
    actingAsCustomer();

    $this->postJson("/api/v1/products/{$product->slug}/reviews", [
        'rating' => 4,
        'title' => 'Great',
        'body' => 'Really solid product, would buy again.',
    ])->assertCreated()->assertJsonPath('data.rating', 4);

    expect($product->fresh())
        ->reviews_count->toBe(1)
        ->rating_avg->toBe(4.0);
});

it('prevents reviewing the same product twice', function () {
    $product = productWithStock();
    actingAsCustomer();
    $payload = ['rating' => 5, 'body' => 'Absolutely perfect product.'];

    $this->postJson("/api/v1/products/{$product->slug}/reviews", $payload)->assertCreated();
    $this->postJson("/api/v1/products/{$product->slug}/reviews", $payload)
        ->assertStatus(409)
        ->assertJsonPath('code', 'already_reviewed');
});

it('requires authentication to review', function () {
    $product = productWithStock();

    $this->postJson("/api/v1/products/{$product->slug}/reviews", ['rating' => 5, 'body' => 'Nice nice nice'])
        ->assertUnauthorized();
});

it('returns reviews with a rating distribution', function () {
    $product = productWithStock();
    \App\Models\Review::factory()->for($product)->create(['rating' => 5]);

    $this->getJson("/api/v1/products/{$product->slug}/reviews")
        ->assertOk()
        ->assertJsonPath('summary.distribution.5', 1);
});
