<?php

namespace App\Exceptions;

class InvalidCouponException extends BusinessException
{
    public static function because(string $reason): self
    {
        return new self($reason, 'invalid_coupon', 422, ['coupon_code' => [$reason]]);
    }
}
