<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\BusinessException;
use App\Exceptions\InvalidOrderTransitionException;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        private readonly CouponService $coupons,
        private readonly PaymentGateway $gateway,
    ) {}

    /**
     * The single entry point for every status change (admin, customer, webhook, scheduler).
     */
    public function transition(Order $order, OrderStatus $to, ?User $by = null, ?string $note = null): Order
    {
        $from = $order->status;

        if ($from === $to) {
            return $order;
        }

        if (! $from->canTransitionTo($to)) {
            throw InvalidOrderTransitionException::between($from, $to);
        }

        // Talk to the provider before touching the DB: a failed refund leaves the order unchanged.
        if ($to === OrderStatus::Refunded) {
            $this->refundPayment($order);
        }

        return DB::transaction(function () use ($order, $from, $to, $by, $note) {
            $order->status = $to;

            if ($to === OrderStatus::Paid) {
                $order->paid_at ??= now();
            }

            $order->save();

            $order->statusHistories()->create([
                'changed_by' => $by?->id,
                'from_status' => $from->value,
                'to_status' => $to->value,
                'note' => $note,
            ]);

            $wasRevenue = in_array($from, OrderStatus::revenue(), true);

            if ($to === OrderStatus::Paid) {
                $this->adjustSoldCount($order, +1);
            }

            if ($to->releasesStock()) {
                $this->restock($order);

                if ($wasRevenue) {
                    $this->adjustSoldCount($order, -1);
                }

                if ($to === OrderStatus::Cancelled && $from === OrderStatus::Pending) {
                    $this->coupons->release($order);
                }
            }

            return $order->refresh();
        });
    }

    /**
     * Called from the Stripe webhook. Idempotent: replaying the event is harmless.
     *
     * @param  array<string, mixed>  $payload
     */
    public function markPaid(Payment $payment, array $payload = []): void
    {
        DB::transaction(function () use ($payment, $payload) {
            $payment->update(['status' => PaymentStatus::Succeeded, 'payload' => $payload]);

            $order = $payment->order()->lockForUpdate()->first();

            if ($order->status === OrderStatus::Pending) {
                $this->transition($order, OrderStatus::Paid, null, 'Payment confirmed by '.$payment->provider.'.');
            }
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function markPaymentFailed(Payment $payment, array $payload = []): void
    {
        // The order stays "pending": the customer may retry with the same PaymentIntent.
        $payment->update(['status' => PaymentStatus::Failed, 'payload' => $payload]);
    }

    public function cancelByCustomer(Order $order, User $user): Order
    {
        if ($order->status !== OrderStatus::Pending) {
            throw new BusinessException('Only unpaid orders can be cancelled. Please contact support.', 'order_not_cancellable');
        }

        return $this->transition($order, OrderStatus::Cancelled, $user, 'Cancelled by customer.');
    }

    /**
     * Cancel unpaid orders older than the reservation window, releasing stock.
     */
    public function expireStalePendingOrders(): int
    {
        $count = 0;

        Order::query()
            ->where('status', OrderStatus::Pending->value)
            ->where('created_at', '<', now()->subMinutes((int) config('store.pending_order_ttl')))
            ->lazyById()
            ->each(function (Order $order) use (&$count) {
                $this->transition($order, OrderStatus::Cancelled, null, 'Payment window expired.');
                $count++;
            });

        return $count;
    }

    private function restock(Order $order): void
    {
        foreach ($order->items()->whereNotNull('product_variant_id')->get() as $item) {
            ProductVariant::query()->whereKey($item->product_variant_id)->increment('stock', $item->quantity);
        }
    }

    private function adjustSoldCount(Order $order, int $direction): void
    {
        foreach ($order->items()->whereNotNull('product_id')->get() as $item) {
            $query = Product::withTrashed()->whereKey($item->product_id);

            $direction > 0
                ? $query->increment('sold_count', $item->quantity)
                : $query->where('sold_count', '>=', $item->quantity)->decrement('sold_count', $item->quantity);
        }
    }

    private function refundPayment(Order $order): void
    {
        $payment = $order->payments()->where('status', PaymentStatus::Succeeded->value)->latest('id')->first();

        if (! $payment) {
            return;
        }

        $this->gateway->refund($payment->provider_payment_id);
        $payment->update(['status' => PaymentStatus::Refunded]);
    }
}
