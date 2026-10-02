<?php

use App\Models\Category;
use App\Models\Product;

it('lists active products with pagination meta', function () {
    Product::factory(3)->withStock()->create();
    Product::factory()->withStock()->inactive()->create();

    $this->getJson('/api/v1/products')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('meta.total', 3)
        ->assertJsonStructure(['data' => ['*' => ['id', 'name', 'slug', 'price_min', 'in_stock', 'rating_avg']], 'links', 'meta']);
});

it('filters by parent category including its children', function () {
    $parent = Category::factory()->create(['slug' => 'electronics']);
    $child = Category::factory()->create(['parent_id' => $parent->id]);
    Product::factory()->withStock()->for($child)->create();
    Product::factory()->withStock()->for($parent)->create();
    Product::factory()->withStock()->create();

    $this->getJson('/api/v1/products?category=electronics')->assertOk()->assertJsonCount(2, 'data');
});

it('filters by price range (cents) and sorts by price', function () {
    productWithStock(price: 1000);
    productWithStock(price: 5000);
    productWithStock(price: 9000);

    $response = $this->getJson('/api/v1/products?min_price=2000&max_price=10000&sort=price_desc')->assertOk();

    expect(collect($response->json('data'))->pluck('base_price')->all())->toBe([9000, 5000]);
});

it('filters by minimum rating', function () {
    Product::factory()->withStock()->create()->forceFill(['rating_avg' => 4.6])->save();
    Product::factory()->withStock()->create()->forceFill(['rating_avg' => 2.1])->save();

    $this->getJson('/api/v1/products?rating=4')->assertOk()->assertJsonCount(1, 'data');
});

it('searches by name', function () {
    productWithStock(attributes: ['name' => 'Golden Watch']);
    productWithStock(attributes: ['name' => 'Silver Ring']);

    $this->getJson('/api/v1/products?search=golden')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Golden Watch');
});

it('validates filter parameters', function () {
    $this->getJson('/api/v1/products?sort=hacker&min_price=-5')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['sort', 'min_price']);
});

it('shows a product by slug with its variants', function () {
    $product = productWithStock(7, 4200);

    $this->getJson("/api/v1/products/{$product->slug}")
        ->assertOk()
        ->assertJsonPath('data.slug', $product->slug)
        ->assertJsonPath('data.total_stock', 7)
        ->assertJsonPath('data.variants.0.price', 4200);
});

it('hides inactive products', function () {
    $product = Product::factory()->withStock()->inactive()->create();

    $this->getJson("/api/v1/products/{$product->slug}")
        ->assertNotFound()
        ->assertJsonPath('code', 'not_found');
});

it('lists categories with product counts', function () {
    $category = Category::factory()->create();
    Product::factory(2)->withStock()->for($category)->create();

    $this->getJson('/api/v1/categories')
        ->assertOk()
        ->assertJsonPath('data.0.products_count', 2);
});
