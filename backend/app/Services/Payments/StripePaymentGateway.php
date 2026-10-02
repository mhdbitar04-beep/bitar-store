<?php

namespace App\Services\Payments;

use App\Exceptions\BusinessException;
use App\Models\Order;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

class StripePaymentGateway implements PaymentGateway
{
    private ?StripeClient $client = null;

    public function __construct(
        private readonly string $secret,
        private readonly string $webhookSecret,
        private readonly int $tolerance = 300,
    ) {}

    public function name(): string
    {
        return 'stripe';
    }

    public function createPaymentIntent(Order $order): PaymentIntentData
    {
        try {
            $intent = $this->client()->paymentIntents->create([
                'amount' => $order->total,
                'currency' => $order->currency,
                'automatic_payment_methods' => ['enabled' => true],
                'description' => "BITAR STORE order {$order->number}",
                'metadata' => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->number,
                ],
            ], [
                // Retrying checkout for the same order never creates a second charge.
                'idempotency_key' => 'order-'.$order->id.'-'.$order->total,
            ]);
        } catch (ApiErrorException $e) {
            report($e);

            throw new BusinessException('Payment provider is unavailable. Please try again.', 'payment_unavailable', 502);
        }

        return new PaymentIntentData($intent->id, (string) $intent->client_secret, $intent->status);
    }

    public function clientSecretFor(string $providerPaymentId): string
    {
        try {
            return (string) $this->client()->paymentIntents->retrieve($providerPaymentId)->client_secret;
        } catch (ApiErrorException $e) {
            report($e);

            throw new BusinessException('Payment provider is unavailable. Please try again.', 'payment_unavailable', 502);
        }
    }

    public function refund(string $providerPaymentId, ?int $amount = null): void
    {
        try {
            $this->client()->refunds->create(array_filter([
                'payment_intent' => $providerPaymentId,
                'amount' => $amount,
            ]));
        } catch (ApiErrorException $e) {
            report($e);

            throw new BusinessException('Refund failed at the payment provider.', 'refund_failed', 502);
        }
    }

    public function parseWebhook(string $payload, ?string $signatureHeader): array
    {
        try {
            $event = Webhook::constructEvent($payload, (string) $signatureHeader, $this->webhookSecret, $this->tolerance);
        } catch (SignatureVerificationException|UnexpectedValueException) {
            throw new BusinessException('Invalid webhook signature.', 'invalid_signature', 400);
        }

        return $event->toArray();
    }

    private function client(): StripeClient
    {
        return $this->client ??= new StripeClient($this->secret);
    }
}
