<?php

use App\Enums\CouponType;
use App\Models\Coupon;
use App\Services\CouponService;

function coupon(CouponType $type, int $value, ?int $max = null): Coupon
{
    $coupon = new Coupon;
    $coupon->forceFill(['type' => $type, 'value' => $value, 'max_discount' => $max]);

    return $coupon;
}

it('calculates discounts in cents', function (Coupon $coupon, int $subtotal, int $expected) {
    expect((new CouponService)->discountFor($coupon, $subtotal))->toBe($expected);
})->with([
    'percent' => [fn () => coupon(CouponType::Percent, 10), 10000, 1000],
    'percent capped' => [fn () => coupon(CouponType::Percent, 50, 2000), 10000, 2000],
    'fixed' => [fn () => coupon(CouponType::Fixed, 1500), 10000, 1500],
    'fixed never above subtotal' => [fn () => coupon(CouponType::Fixed, 5000), 3000, 3000],
    'percent rounds down' => [fn () => coupon(CouponType::Percent, 15), 999, 149],
]);
