<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        $rating = fake()->randomElement([5, 5, 5, 4, 4, 4, 3, 2, 1]);

        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'rating' => $rating,
            'title' => fake()->randomElement([
                5 => ['Absolutely love it', 'Exceeded expectations', 'Worth every penny', 'Premium quality'],
                4 => ['Very good', 'Great value', 'Happy with it'],
                3 => ['It is okay', 'Decent for the price'],
                2 => ['Not great', 'Expected more'],
                1 => ['Disappointed', 'Would not buy again'],
            ][$rating]),
            'body' => fake()->paragraph(3),
            'is_verified_purchase' => fake()->boolean(60),
            'is_approved' => true,
        ];
    }
}
