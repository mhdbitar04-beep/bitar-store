<?php

use App\Models\Attribute;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('blocks customers from the admin API', function () {
    actingAsCustomer();

    $this->getJson('/api/v1/admin/products')
        ->assertForbidden()
        ->assertJsonPath('code', 'forbidden');
});

it('creates a simple product with a default variant', function () {
    actingAsAdmin();
    $category = Category::factory()->create();

    $this->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'name' => 'Gold Pen',
        'base_price' => 2500,
        'stock' => 12,
    ])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'gold-pen')
        ->assertJsonPath('data.total_stock', 12)
        ->assertJsonCount(1, 'data.variants');
});

it('creates a product with option variants', function () {
    actingAsAdmin();
    $category = Category::factory()->create();
    $size = Attribute::query()->create(['name' => 'Size', 'slug' => 'size', 'type' => 'select']);
    $s42 = $size->values()->create(['value' => '42']);
    $s43 = $size->values()->create(['value' => '43']);

    $this->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'name' => 'Runner',
        'base_price' => 9900,
        'variants' => [
            ['sku' => 'RUN-42', 'stock' => 3, 'attribute_value_ids' => [$s42->id]],
            ['sku' => 'RUN-43', 'stock' => 4, 'price' => 10900, 'attribute_value_ids' => [$s43->id]],
        ],
    ])
        ->assertCreated()
        ->assertJsonCount(2, 'data.variants')
        ->assertJsonPath('data.price_max', 10900)
        ->assertJsonPath('data.options.0.attribute.slug', 'size');
});

it('rejects duplicate SKUs', function () {
    actingAsAdmin();
    $existing = productWithStock();

    $this->postJson('/api/v1/admin/products', [
        'category_id' => $existing->category_id,
        'name' => 'Clone',
        'base_price' => 100,
        'variants' => [['sku' => $existing->variants->first()->sku, 'stock' => 1]],
    ])->assertUnprocessable()->assertJsonValidationErrors(['variants.0.sku']);
});

it('uploads multiple images and sets the first as primary', function () {
    Storage::fake('public');
    actingAsAdmin();
    $product = productWithStock();

    $this->post("/api/v1/admin/products/{$product->id}/images", [
        'images' => [UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.png')],
    ], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.is_primary', true);

    expect(Storage::disk('public')->allFiles("products/{$product->id}"))->toHaveCount(2);
});

it('updates a product', function () {
    actingAsAdmin();
    $product = productWithStock();

    $this->putJson("/api/v1/admin/products/{$product->id}", ['name' => 'Renamed', 'is_featured' => true])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed')
        ->assertJsonPath('data.is_featured', true);
});

it('soft deletes a product', function () {
    actingAsAdmin();
    $product = productWithStock();

    $this->deleteJson("/api/v1/admin/products/{$product->id}")->assertNoContent();

    expect(Product::withTrashed()->find($product->id)->trashed())->toBeTrue();
    $this->getJson("/api/v1/products/{$product->slug}")->assertNotFound();
});

it('manages categories and refuses deleting non-empty ones', function () {
    actingAsAdmin();

    $id = $this->postJson('/api/v1/admin/categories', ['name' => 'Gifts'])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'gifts')
        ->json('data.id');

    productWithStock(attributes: ['category_id' => $id]);

    $this->deleteJson("/api/v1/admin/categories/{$id}")
        ->assertStatus(409)
        ->assertJsonPath('code', 'category_not_empty');
});

it('manages coupons', function () {
    actingAsAdmin();

    $id = $this->postJson('/api/v1/admin/coupons', ['code' => 'vip25', 'type' => 'percent', 'value' => 25])
        ->assertCreated()
        ->assertJsonPath('data.code', 'VIP25')
        ->json('data.id');

    $this->postJson('/api/v1/admin/coupons', ['code' => 'bad', 'type' => 'percent', 'value' => 150])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['value']);

    $this->putJson("/api/v1/admin/coupons/{$id}", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
    $this->deleteJson("/api/v1/admin/coupons/{$id}")->assertNoContent();
});
