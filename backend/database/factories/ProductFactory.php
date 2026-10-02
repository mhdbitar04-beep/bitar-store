<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = Str::title(fake()->unique()->words(3, true));
        $price = fake()->numberBetween(15, 900) * 100 - 1; // e.g. 4999

        return [
            'category_id' => Category::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'short_description' => fake()->sentence(14),
            'description' => fake()->paragraphs(3, true),
            'base_price' => $price,
            'compare_at_price' => fake()->boolean(30) ? $price + fake()->numberBetween(10, 100) * 100 : null,
            'is_active' => true,
            'is_featured' => fake()->boolean(20),
        ];
    }

    /**
     * Every real product needs at least one variant (stock & SKU live there).
     */
    public function withStock(int $stock = 10, ?int $price = null): static
    {
        return $this->has(
            ProductVariant::factory()->state(['stock' => $stock, 'price' => $price, 'is_default' => true]),
            'variants',
        );
    }

    public function featured(): static
    {
        return $this->state(fn () => ['is_featured' => true]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
