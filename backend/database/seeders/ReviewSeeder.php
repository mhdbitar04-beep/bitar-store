<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Services\ReviewService;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(ReviewService $reviews): void
    {
        $customers = User::query()->where('role', UserRole::Customer->value)->pluck('id');

        Product::query()->each(function (Product $product) use ($customers, $reviews) {
            $authors = $customers->shuffle()->take(fake()->numberBetween(0, 8));

            foreach ($authors as $userId) {
                Review::factory()->create([
                    'user_id' => $userId,
                    'product_id' => $product->id,
                    'created_at' => now()->subDays(fake()->numberBetween(1, 120)),
                ]);
            }

            $reviews->refreshRating($product);
        });
    }
}
