<?php

namespace App\Services\Payments;

use App\Models\Order;

/**
 * Abstraction over the payment provider so the domain never depends on Stripe directly
 * (and tests can swap in FakePaymentGateway without network calls).
 */
interface PaymentGateway
{
    public function name(): string;

    public function createPaymentIntent(Order $order): PaymentIntentData;

    /**
     * Client secret of an existing PaymentIntent (so an unpaid order can be paid later).
     */
    public function clientSecretFor(string $providerPaymentId): string;

    public function refund(string $providerPaymentId, ?int $amount = null): void;

    /**
     * Verify the webhook signature and return the decoded event.
     *
     * @return array{id: string, type: string, data: array{object: array<string, mixed>}}
     *
     * @throws \App\Exceptions\BusinessException when the signature is invalid
     */
    public function parseWebhook(string $payload, ?string $signatureHeader): array;
}
