<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(20, 500) * 100;

        return [
            'number' => 'BS-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
            'user_id' => User::factory(),
            'status' => OrderStatus::Pending,
            'subtotal' => $subtotal,
            'discount_total' => 0,
            'shipping_total' => 0,
            'tax_total' => 0,
            'total' => $subtotal,
            'currency' => 'usd',
            'shipping_address' => [
                'full_name' => fake()->name(),
                'phone' => fake()->e164PhoneNumber(),
                'line1' => fake()->streetAddress(),
                'line2' => null,
                'city' => fake()->city(),
                'state' => fake()->state(),
                'postal_code' => fake()->postcode(),
                'country_code' => 'US',
            ],
        ];
    }

    public function status(OrderStatus $status): static
    {
        return $this->state(fn () => [
            'status' => $status,
            'paid_at' => in_array($status, OrderStatus::revenue(), true) ? now() : null,
        ]);
    }
}
