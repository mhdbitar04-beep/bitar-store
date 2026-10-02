<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Base class for expected, user-facing domain errors (out of stock, bad coupon…).
 * Rendered by ApiExceptionRenderer as { message, code, errors? } with the given status.
 */
class BusinessException extends RuntimeException
{
    /**
     * @param  array<string, list<string>>  $errors
     */
    public function __construct(
        string $message,
        public readonly string $errorCode = 'business_rule_violation',
        public readonly int $status = 422,
        public readonly array $errors = [],
    ) {
        parent::__construct($message);
    }
}
