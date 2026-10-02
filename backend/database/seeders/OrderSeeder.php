<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * ~150 historical orders spread over the last 90 days so the admin charts have data.
 */
class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::query()->where('role', UserRole::Customer->value)->with('addresses')->get();
        $variants = ProductVariant::query()->with(['product.primaryImage', 'attributeValues'])->get();

        $statuses = [
            OrderStatus::Delivered->value => 45,
            OrderStatus::Shipped->value => 15,
            OrderStatus::Processing->value => 12,
            OrderStatus::Paid->value => 10,
            OrderStatus::Pending->value => 6,
            OrderStatus::Cancelled->value => 8,
            OrderStatus::Refunded->value => 4,
        ];

        foreach (range(1, 150) as $n) {
            $customer = $customers->random();
            $status = OrderStatus::from($this->weighted($statuses));
            // More orders in recent weeks -> an upward trend on the chart.
            $createdAt = Carbon::now()->subDays((int) floor(90 * (fake()->randomFloat(3, 0, 1) ** 1.6)))->setTime(fake()->numberBetween(8, 22), fake()->numberBetween(0, 59));

            $lines = $variants->random(fake()->numberBetween(1, 3))->map(fn (ProductVariant $v) => [
                'variant' => $v,
                'quantity' => fake()->randomElement([1, 1, 1, 2]),
            ]);

            $subtotal = $lines->sum(fn ($l) => $l['variant']->effectivePrice() * $l['quantity']);
            $shipping = $subtotal >= config('store.shipping.free_over') ? 0 : config('store.shipping.flat');

            $order = Order::query()->create([
                'number' => 'BS-'.$createdAt->format('ymd').'-'.Str::upper(Str::random(6)),
                'user_id' => $customer->id,
                'status' => $status,
                'subtotal' => $subtotal,
                'shipping_total' => $shipping,
                'total' => $subtotal + $shipping,
                'currency' => config('store.currency'),
                'shipping_address' => $customer->addresses->first()?->toSnapshot() ?? [],
                'paid_at' => in_array($status, [...OrderStatus::revenue(), OrderStatus::Refunded], true) ? $createdAt->copy()->addMinutes(3) : null,
            ]);

            $order->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->saveQuietly();

            foreach ($lines as $line) {
                /** @var ProductVariant $variant */
                $variant = $line['variant'];
                $order->items()->create([
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name,
                    'variant_label' => $variant->label(),
                    'sku' => $variant->sku,
                    'image_url' => $variant->product->primaryImage?->url,
                    'unit_price' => $variant->effectivePrice(),
                    'quantity' => $line['quantity'],
                    'line_total' => $variant->effectivePrice() * $line['quantity'],
                ]);

                if (in_array($status, OrderStatus::revenue(), true)) {
                    Product::query()->whereKey($variant->product_id)->increment('sold_count', $line['quantity']);
                }
            }

            $order->payments()->create([
                'provider' => 'stripe',
                'provider_payment_id' => 'pi_seed_'.Str::lower(Str::random(20)),
                'amount' => $order->total,
                'currency' => $order->currency,
                'status' => match ($status) {
                    OrderStatus::Pending => PaymentStatus::Pending,
                    OrderStatus::Cancelled => PaymentStatus::Failed,
                    OrderStatus::Refunded => PaymentStatus::Refunded,
                    default => PaymentStatus::Succeeded,
                },
            ]);

            $this->history($order, $status, $createdAt);
        }
    }

    private function history(Order $order, OrderStatus $final, Carbon $at): void
    {
        $path = match ($final) {
            OrderStatus::Pending => [OrderStatus::Pending],
            OrderStatus::Cancelled => [OrderStatus::Pending, OrderStatus::Cancelled],
            OrderStatus::Paid => [OrderStatus::Pending, OrderStatus::Paid],
            OrderStatus::Processing => [OrderStatus::Pending, OrderStatus::Paid, OrderStatus::Processing],
            OrderStatus::Shipped => [OrderStatus::Pending, OrderStatus::Paid, OrderStatus::Processing, OrderStatus::Shipped],
            OrderStatus::Delivered => [OrderStatus::Pending, OrderStatus::Paid, OrderStatus::Processing, OrderStatus::Shipped, OrderStatus::Delivered],
            OrderStatus::Refunded => [OrderStatus::Pending, OrderStatus::Paid, OrderStatus::Refunded],
        };

        $previous = null;
        foreach ($path as $i => $status) {
            $order->statusHistories()->make([
                'from_status' => $previous?->value,
                'to_status' => $status->value,
                'note' => $i === 0 ? 'Order placed.' : null,
            ])->forceFill(['created_at' => $at->copy()->addHours($i * 18)])->save();
            $previous = $status;
        }
    }

    /**
     * @param  array<string, int>  $weights
     */
    private function weighted(array $weights): string
    {
        $roll = random_int(1, array_sum($weights));

        foreach ($weights as $key => $weight) {
            if (($roll -= $weight) <= 0) {
                return $key;
            }
        }

        return array_key_first($weights);
    }
}
