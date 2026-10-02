<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Cart\CartLine;
use App\Services\Cart\CartPricingService;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class CheckoutService
{
    public function __construct(
        private readonly CartPricingService $pricing,
        private readonly CouponService $coupons,
        private readonly OrderService $orders,
        private readonly PaymentGateway $gateway,
    ) {}

    /**
     * Creates a pending order (reserving stock) and a PaymentIntent for it.
     *
     * @param  array{items: array<int, array{variant_id: int, quantity: int}>, coupon_code?: ?string, address_id?: ?int, shipping_address?: ?array<string, mixed>, notes?: ?string}  $data
     * @return array{order: Order, client_secret: string}
     */
    public function checkout(User $user, array $data): array
    {
        $order = DB::transaction(function () use ($user, $data) {
            // Row locks make "check stock → decrement" atomic across concurrent buyers.
            $quote = $this->pricing->quote($data['items'], $data['coupon_code'] ?? null, $user, lockForUpdate: true);

            $order = $user->orders()->create([
                'number' => $this->generateNumber(),
                'status' => OrderStatus::Pending,
                'subtotal' => $quote->subtotal,
                'discount_total' => $quote->discount,
                'shipping_total' => $quote->shipping,
                'tax_total' => $quote->tax,
                'total' => $quote->total,
                'currency' => $quote->currency,
                'coupon_id' => $quote->coupon?->id,
                'coupon_code' => $quote->coupon?->code,
                'shipping_address' => $this->resolveAddress($user, $data),
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany(array_map(fn (CartLine $line) => [
                'product_id' => $line->variant->product_id,
                'product_variant_id' => $line->variant->id,
                'product_name' => $line->variant->product->name,
                'variant_label' => $line->variant->label(),
                'sku' => $line->variant->sku,
                'image_url' => $line->variant->product->primaryImage?->url,
                'unit_price' => $line->unitPrice,
                'quantity' => $line->quantity,
                'line_total' => $line->lineTotal(),
            ], $quote->lines));

            foreach ($quote->lines as $line) {
                ProductVariant::query()->whereKey($line->variant->id)->decrement('stock', $line->quantity);
            }

            if ($quote->coupon) {
                $this->coupons->redeem($quote->coupon, $user, $order, $quote->discount);
            }

            $order->statusHistories()->create([
                'changed_by' => $user->id,
                'from_status' => null,
                'to_status' => OrderStatus::Pending->value,
                'note' => 'Order placed.',
            ]);

            return $order;
        });

        // Network call happens outside the transaction so DB locks are not held while waiting on Stripe.
        try {
            $intent = $this->gateway->createPaymentIntent($order);
        } catch (Throwable $e) {
            $this->orders->transition($order, OrderStatus::Cancelled, null, 'Payment could not be initialised.');

            throw $e;
        }

        $order->payments()->create([
            'provider' => $this->gateway->name(),
            'provider_payment_id' => $intent->id,
            'amount' => $order->total,
            'currency' => $order->currency,
            'status' => PaymentStatus::Pending,
        ]);

        return ['order' => $order, 'client_secret' => $intent->clientSecret];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function resolveAddress(User $user, array $data): array
    {
        if (! empty($data['address_id'])) {
            /** @var Address $address */
            $address = $user->addresses()->findOrFail($data['address_id']);

            return $address->toSnapshot();
        }

        $address = $data['shipping_address'];

        if (! empty($address['save'])) {
            unset($address['save']);
            $user->addresses()->create($address + ['is_default' => ! $user->addresses()->exists()]);
        }

        unset($address['save'], $address['label'], $address['is_default']);

        return $address;
    }

    private function generateNumber(): string
    {
        do {
            $number = 'BS-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (Order::query()->where('number', $number)->exists());

        return $number;
    }
}
