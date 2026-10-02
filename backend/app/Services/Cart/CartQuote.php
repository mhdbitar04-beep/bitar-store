<?php

namespace App\Services\Cart;

use App\Models\Coupon;

/**
 * Server-side, authoritative price calculation for a cart. The frontend total is
 * only ever a preview — every checkout is re-priced from this.
 */
final readonly class CartQuote
{
    /**
     * @param  list<CartLine>  $lines
     */
    public function __construct(
        public array $lines,
        public int $subtotal,
        public int $discount,
        public int $shipping,
        public int $tax,
        public int $total,
        public string $currency,
        public ?Coupon $coupon = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'items' => array_map(fn (CartLine $line) => [
                'variant_id' => $line->variant->id,
                'product_id' => $line->variant->product->id,
                'product_slug' => $line->variant->product->slug,
                'name' => $line->variant->product->name,
                'variant_label' => $line->variant->label(),
                'sku' => $line->variant->sku,
                'image_url' => $line->variant->product->primaryImage?->url,
                'unit_price' => $line->unitPrice,
                'quantity' => $line->quantity,
                'line_total' => $line->lineTotal(),
                'stock' => $line->variant->stock,
            ], $this->lines),
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'shipping' => $this->shipping,
            'tax' => $this->tax,
            'total' => $this->total,
            'currency' => $this->currency,
            'coupon' => $this->coupon ? [
                'code' => $this->coupon->code,
                'type' => $this->coupon->type->value,
                'value' => $this->coupon->value,
            ] : null,
        ];
    }
}
