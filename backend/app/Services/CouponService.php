<?php

namespace App\Services;

use App\Enums\CouponType;
use App\Exceptions\InvalidCouponException;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;

class CouponService
{
    /**
     * Find a coupon and make sure it can be applied to this subtotal / user.
     *
     * @throws InvalidCouponException
     */
    public function resolve(string $code, int $subtotal, ?User $user): Coupon
    {
        $coupon = Coupon::query()->where('code', strtoupper(trim($code)))->first();

        if (! $coupon || ! $coupon->is_active) {
            throw InvalidCouponException::because('This coupon code is not valid.');
        }

        if ($coupon->starts_at && $coupon->starts_at->isFuture()) {
            throw InvalidCouponException::because('This coupon is not active yet.');
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            throw InvalidCouponException::because('This coupon has expired.');
        }

        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            throw InvalidCouponException::because('This coupon has reached its usage limit.');
        }

        if ($user && $coupon->per_user_limit !== null) {
            $used = $coupon->redemptions()->where('user_id', $user->id)->count();

            if ($used >= $coupon->per_user_limit) {
                throw InvalidCouponException::because('You have already used this coupon.');
            }
        }

        if ($coupon->min_order_amount !== null && $subtotal < $coupon->min_order_amount) {
            $min = number_format($coupon->min_order_amount / 100, 2);

            throw InvalidCouponException::because("Minimum order amount for this coupon is \${$min}.");
        }

        return $coupon;
    }

    /**
     * Discount in cents, never larger than the subtotal.
     */
    public function discountFor(Coupon $coupon, int $subtotal): int
    {
        $discount = match ($coupon->type) {
            CouponType::Percent => intdiv($subtotal * min($coupon->value, 100), 100),
            CouponType::Fixed => $coupon->value,
        };

        if ($coupon->max_discount !== null) {
            $discount = min($discount, $coupon->max_discount);
        }

        return max(0, min($discount, $subtotal));
    }

    /**
     * Atomically consume one use of the coupon. The conditional UPDATE prevents two
     * concurrent checkouts from exceeding usage_limit.
     */
    public function redeem(Coupon $coupon, User $user, Order $order, int $discount): void
    {
        $updated = Coupon::query()
            ->whereKey($coupon->id)
            ->where(fn ($q) => $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))
            ->increment('used_count');

        if ($updated === 0) {
            throw InvalidCouponException::because('This coupon has reached its usage limit.');
        }

        $order->couponRedemption()->create([
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'discount_amount' => $discount,
        ]);
    }

    /**
     * Give the coupon use back (e.g. the order was cancelled before payment).
     */
    public function release(Order $order): void
    {
        $redemption = $order->couponRedemption()->first();

        if (! $redemption) {
            return;
        }

        Coupon::query()->whereKey($redemption->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
        $redemption->delete();
    }
}
