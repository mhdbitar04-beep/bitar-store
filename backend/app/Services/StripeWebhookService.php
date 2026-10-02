<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\StripeEvent;
use App\Services\Payments\PaymentGateway;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class StripeWebhookService
{
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly OrderService $orders,
    ) {}

    /**
     * @return string what happened (for logs / response)
     */
    public function handle(string $payload, ?string $signature): string
    {
        $event = $this->gateway->parseWebhook($payload, $signature);

        if (StripeEvent::query()->where('event_id', $event['id'])->exists()) {
            return 'duplicate';
        }

        try {
            return DB::transaction(function () use ($event) {
                // Insert first: the unique index makes concurrent deliveries of the same event safe.
                StripeEvent::query()->create(['event_id' => $event['id'], 'type' => $event['type']]);

                $object = $event['data']['object'] ?? [];

                return match ($event['type']) {
                    'payment_intent.succeeded' => $this->onSucceeded($object),
                    'payment_intent.payment_failed' => $this->onFailed($object),
                    default => 'ignored',
                };
            });
        } catch (UniqueConstraintViolationException) {
            return 'duplicate';
        }
    }

    /**
     * @param  array<string, mixed>  $intent
     */
    private function onSucceeded(array $intent): string
    {
        $payment = $this->findPayment($intent);

        if (! $payment) {
            return 'unknown_payment';
        }

        if ((int) ($intent['amount_received'] ?? $intent['amount'] ?? 0) < $payment->amount) {
            // Never mark an order paid for less than its total.
            return 'amount_mismatch';
        }

        $this->orders->markPaid($payment, $intent);

        return 'paid';
    }

    /**
     * @param  array<string, mixed>  $intent
     */
    private function onFailed(array $intent): string
    {
        $payment = $this->findPayment($intent);

        if (! $payment) {
            return 'unknown_payment';
        }

        $this->orders->markPaymentFailed($payment, $intent);

        return 'failed';
    }

    /**
     * @param  array<string, mixed>  $intent
     */
    private function findPayment(array $intent): ?Payment
    {
        return Payment::query()->where('provider_payment_id', $intent['id'] ?? '')->first();
    }
}
