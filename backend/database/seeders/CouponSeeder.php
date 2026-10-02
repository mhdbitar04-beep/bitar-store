<?php

namespace Database\Seeders;

use App\Enums\CouponType;
use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            ['code' => 'WELCOME10', 'type' => CouponType::Percent, 'value' => 10, 'per_user_limit' => 1, 'expires_at' => now()->addYear()],
            ['code' => 'GOLD20', 'type' => CouponType::Percent, 'value' => 20, 'min_order_amount' => 20000, 'max_discount' => 10000, 'expires_at' => now()->addMonths(3)],
            ['code' => 'SAVE15', 'type' => CouponType::Fixed, 'value' => 1500, 'min_order_amount' => 7500, 'usage_limit' => 500, 'expires_at' => now()->addMonths(6)],
            ['code' => 'EXPIRED5', 'type' => CouponType::Percent, 'value' => 5, 'expires_at' => now()->subWeek()],
        ];

        foreach ($coupons as $coupon) {
            Coupon::query()->create($coupon);
        }
    }
}
