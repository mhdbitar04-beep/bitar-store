<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Str;

/**
 * Offline gateway used by the test-suite and for demos without Stripe keys.
 * Webhooks are still signature-verified exactly like Stripe's.
 */
class FakePaymentGateway implements PaymentGateway
{
    /** @var list<array{id: string, amount: ?int}> */
    public array $refunds = [];

    public function name(): string
    {
        return 'fake';
    }

    public function createPaymentIntent(Order $order): PaymentIntentData
    {
        $id = 'pi_fake_'.Str::lower(Str::random(20));

        return new PaymentIntentData($id, $id.'_secret_'.Str::random(10), 'requires_payment_method');
    }

    public function clientSecretFor(string $providerPaymentId): string
    {
        return $providerPaymentId.'_secret_fake';
    }

    public function refund(string $providerPaymentId, ?int $amount = null): void
    {
        $this->refunds[] = ['id' => $providerPaymentId, 'amount' => $amount];
    }

    public function parseWebhook(string $payload, ?string $signatureHeader): array
    {
        StripeSignature::verify(
            $payload,
            $signatureHeader,
            (string) config('services.stripe.webhook_secret'),
            (int) config('services.stripe.webhook_tolerance', 300),
        );

        return json_decode($payload, true, flags: JSON_THROW_ON_ERROR);
    }
}
