<?php

namespace App\Services\Cart;

use App\Models\ProductVariant;

final readonly class CartLine
{
    public function __construct(
        public ProductVariant $variant,
        public int $quantity,
        public int $unitPrice,
    ) {}

    public function lineTotal(): int
    {
        return $this->unitPrice * $this->quantity;
    }
}
