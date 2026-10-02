<?php

namespace App\Exceptions;

use App\Enums\OrderStatus;

class InvalidOrderTransitionException extends BusinessException
{
    public static function between(OrderStatus $from, OrderStatus $to): self
    {
        return new self(
            "Cannot change order status from {$from->value} to {$to->value}.",
            'invalid_status_transition',
            422,
            ['status' => ["Transition {$from->value} → {$to->value} is not allowed."]],
        );
    }
}
