<?php

namespace App\Services\Cart;

use App\Exceptions\BusinessException;
use App\Exceptions\OutOfStockException;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\CouponService;

class CartPricingService
{
    public function __construct(private readonly CouponService $coupons) {}

    /**
     * @param  array<int, array{variant_id: int, quantity: int}>  $items
     * @param  bool  $lockForUpdate  lock variant rows (inside a checkout transaction)
     *
     * @throws OutOfStockException|BusinessException
     */
    public function quote(array $items, ?string $couponCode = null, ?User $user = null, bool $lockForUpdate = false): CartQuote
    {
        // Merge duplicate lines of the same variant.
        $quantities = [];
        foreach ($items as $item) {
            $id = (int) $item['variant_id'];
            $quantities[$id] = ($quantities[$id] ?? 0) + (int) $item['quantity'];
        }

        $query = ProductVariant::query()
            ->whereKey(array_keys($quantities))
            ->with(['product.primaryImage', 'attributeValues']);

        if ($lockForUpdate) {
            // Sort to always lock rows in the same order and avoid deadlocks.
            $query->orderBy('id')->lockForUpdate();
        }

        $variants = $query->get()->keyBy('id');

        $lines = [];
        foreach ($quantities as $variantId => $quantity) {
            /** @var ProductVariant|null $variant */
            $variant = $variants->get($variantId);

            if (! $variant || ! $variant->is_active || ! $variant->product || $variant->product->trashed() || ! $variant->product->is_active) {
                throw new BusinessException(
                    'One of the products in your cart is no longer available.',
                    'product_unavailable',
                    422,
                    ['items' => ["Variant {$variantId} is unavailable."]],
                );
            }

            if ($variant->stock < $quantity) {
                throw OutOfStockException::forVariant($variant->sku, $variant->stock);
            }

            $lines[] = new CartLine($variant, $quantity, $variant->effectivePrice());
        }

        $subtotal = array_sum(array_map(fn (CartLine $l) => $l->lineTotal(), $lines));

        $coupon = null;
        $discount = 0;
        if ($couponCode) {
            $coupon = $this->coupons->resolve($couponCode, $subtotal, $user);
            $discount = $this->coupons->discountFor($coupon, $subtotal);
        }

        $afterDiscount = $subtotal - $discount;
        $shipping = $this->shippingFor($afterDiscount);
        $tax = (int) round($afterDiscount * ((float) config('store.tax_rate')) / 100);

        return new CartQuote(
            lines: $lines,
            subtotal: $subtotal,
            discount: $discount,
            shipping: $shipping,
            tax: $tax,
            total: $afterDiscount + $shipping + $tax,
            currency: (string) config('store.currency'),
            coupon: $coupon,
        );
    }

    private function shippingFor(int $amount): int
    {
        if ($amount <= 0 || $amount >= (int) config('store.shipping.free_over')) {
            return 0;
        }

        return (int) config('store.shipping.flat');
    }
}
