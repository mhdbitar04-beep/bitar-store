<?php

namespace Database\Factories;

use App\Enums\CouponType;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => Str::upper(Str::random(8)),
            'type' => CouponType::Percent,
            'value' => 10,
            'min_order_amount' => null,
            'max_discount' => null,
            'usage_limit' => null,
            'per_user_limit' => null,
            'starts_at' => null,
            'expires_at' => now()->addMonth(),
            'is_active' => true,
        ];
    }

    public function percent(int $value): static
    {
        return $this->state(fn () => ['type' => CouponType::Percent, 'value' => $value]);
    }

    public function fixed(int $cents): static
    {
        return $this->state(fn () => ['type' => CouponType::Fixed, 'value' => $cents]);
    }

    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subDay()]);
    }
}
