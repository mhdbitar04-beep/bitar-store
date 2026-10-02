<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Admin-side catalogue management.
 */
class ProductService
{
    private const PRODUCT_FIELDS = [
        'category_id', 'name', 'short_description', 'description',
        'base_price', 'compare_at_price', 'is_active', 'is_featured',
    ];

    /**
     * @param  array<string, mixed>  $data
     * @param  list<UploadedFile>  $images
     */
    public function create(array $data, array $images = []): Product
    {
        $product = DB::transaction(function () use ($data) {
            $product = new Product(Arr::only($data, self::PRODUCT_FIELDS));
            $product->slug = $this->uniqueSlug($data['slug'] ?? $data['name']);
            $product->save();

            $this->syncVariants($product, $data['variants'] ?? null, (int) ($data['stock'] ?? 0));

            return $product;
        });

        if ($images !== []) {
            $this->addImages($product, $images);
        }

        return $product;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->fill(Arr::only($data, self::PRODUCT_FIELDS));

            if (! empty($data['slug']) && $data['slug'] !== $product->slug) {
                $product->slug = $this->uniqueSlug($data['slug'], $product->id);
            }

            $product->save();

            if (array_key_exists('variants', $data) || array_key_exists('stock', $data)) {
                $this->syncVariants($product, $data['variants'] ?? null, isset($data['stock']) ? (int) $data['stock'] : null);
            }

            return $product;
        });
    }

    public function delete(Product $product): void
    {
        // Soft delete: historical orders keep pointing at the product.
        DB::transaction(function () use ($product) {
            $product->update(['is_active' => false, 'is_featured' => false]);
            $product->delete();
        });
    }

    /**
     * @param  list<UploadedFile>  $files
     * @return list<ProductImage>
     */
    public function addImages(Product $product, array $files): array
    {
        $nextOrder = (int) $product->images()->max('sort_order') + 1;
        $hasPrimary = $product->images()->where('is_primary', true)->exists();
        $created = [];

        foreach ($files as $i => $file) {
            $path = $file->store("products/{$product->id}", 'public');

            $created[] = $product->images()->create([
                'path' => $path,
                'alt' => $product->name,
                'sort_order' => $nextOrder + $i,
                'is_primary' => ! $hasPrimary && $i === 0,
            ]);
        }

        return $created;
    }

    public function deleteImage(ProductImage $image): void
    {
        DB::transaction(function () use ($image) {
            $product = $image->product;
            $wasPrimary = $image->is_primary;

            // Only files uploaded through the admin live on the public disk.
            if (str_starts_with($image->path, 'products/')) {
                Storage::disk('public')->delete($image->path);
            }

            $image->delete();

            if ($wasPrimary) {
                $product->images()->orderBy('sort_order')->first()?->update(['is_primary' => true]);
            }
        });
    }

    public function setPrimaryImage(ProductImage $image): void
    {
        DB::transaction(function () use ($image) {
            ProductImage::query()->where('product_id', $image->product_id)->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
        });
    }

    /**
     * Every product has at least one variant: variant rows own stock and SKU.
     *
     * @param  list<array<string, mixed>>|null  $variants
     */
    private function syncVariants(Product $product, ?array $variants, ?int $stock): void
    {
        if (empty($variants)) {
            $default = $product->variants()->orderByDesc('is_default')->orderBy('id')->first();

            if (! $default) {
                $product->variants()->create([
                    'sku' => $this->generateSku($product),
                    'stock' => $stock ?? 0,
                    'is_default' => true,
                    'is_active' => true,
                ]);
            } elseif ($stock !== null && $product->variants()->count() === 1) {
                $default->update(['stock' => $stock]);
            }

            return;
        }

        $keep = [];

        foreach (array_values($variants) as $index => $row) {
            $attributes = [
                'sku' => ($row['sku'] ?? null) ?: $this->generateSku($product),
                'price' => $row['price'] ?? null,
                'stock' => (int) ($row['stock'] ?? 0),
                'is_active' => (bool) ($row['is_active'] ?? true),
                'is_default' => $index === 0,
            ];

            $variant = ! empty($row['id'])
                ? $product->variants()->whereKey($row['id'])->firstOrFail()
                : new ProductVariant;

            $variant->fill($attributes);
            $variant->product()->associate($product);
            $variant->save();

            $variant->attributeValues()->sync($row['attribute_value_ids'] ?? []);

            $keep[] = $variant->id;
        }

        // Removed variants are deleted; order_items keep their snapshot (FK is nullOnDelete).
        $product->variants()->whereNotIn('id', $keep)->delete();
    }

    private function uniqueSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'product';
        $slug = $base;
        $i = 2;

        while (Product::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    private function generateSku(Product $product): string
    {
        do {
            $sku = Str::upper(Str::limit(Str::slug($product->name, ''), 8, '')).'-'.Str::upper(Str::random(5));
        } while (ProductVariant::query()->where('sku', $sku)->exists());

        return $sku;
    }
}
