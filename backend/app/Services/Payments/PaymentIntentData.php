<?php

namespace App\Services\Payments;

final readonly class PaymentIntentData
{
    public function __construct(
        public string $id,
        public string $clientSecret,
        public string $status,
    ) {}
}
