<?php

namespace App\Exceptions;

class OutOfStockException extends BusinessException
{
    public static function forVariant(string $sku, int $available): self
    {
        return new self(
            $available > 0
                ? "Only {$available} left in stock for {$sku}."
                : "{$sku} is out of stock.",
            'out_of_stock',
            422,
            ['items' => ["Insufficient stock for {$sku}."]],
        );
    }
}
