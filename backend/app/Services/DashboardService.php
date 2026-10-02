<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function overview(int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();
        $previousFrom = $from->copy()->subDays($days);

        $current = $this->totals($from, now());
        $previous = $this->totals($previousFrom, $from);

        return [
            'range_days' => $days,
            'kpis' => [
                'revenue' => $current['revenue'],
                'orders' => $current['orders'],
                'average_order_value' => $current['orders'] > 0 ? intdiv($current['revenue'], $current['orders']) : 0,
                'new_customers' => User::query()->where('role', UserRole::Customer->value)->where('created_at', '>=', $from)->count(),
                'revenue_change' => $this->percentChange($previous['revenue'], $current['revenue']),
                'orders_change' => $this->percentChange($previous['orders'], $current['orders']),
                'pending_orders' => Order::query()->where('status', OrderStatus::Pending->value)->count(),
                'low_stock_variants' => ProductVariant::query()->where('is_active', true)->where('stock', '<=', 5)->count(),
            ],
            'sales_over_time' => $this->salesOverTime($from, $days),
            'top_products' => $this->topProducts($from),
            'orders_by_status' => $this->ordersByStatus(),
        ];
    }

    /**
     * @return array{revenue: int, orders: int}
     */
    private function totals(Carbon $from, Carbon $to): array
    {
        $row = Order::query()
            ->whereIn('status', $this->revenueStatuses())
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue')
            ->toBase()
            ->first();

        return ['revenue' => (int) $row->revenue, 'orders' => (int) $row->orders];
    }

    /**
     * One point per day, including days without sales (so the chart has no gaps).
     *
     * @return list<array{date: string, revenue: int, orders: int}>
     */
    private function salesOverTime(Carbon $from, int $days): array
    {
        $rows = Order::query()
            ->whereIn('status', $this->revenueStatuses())
            ->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('day')
            ->toBase()
            ->get()
            ->keyBy('day');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $from->copy()->addDays($i)->toDateString();
            $series[] = [
                'date' => $day,
                'revenue' => (int) ($rows[$day]->revenue ?? 0),
                'orders' => (int) ($rows[$day]->orders ?? 0),
            ];
        }

        return $series;
    }

    /**
     * @return list<array{product_id: ?int, name: string, quantity: int, revenue: int}>
     */
    private function topProducts(Carbon $from, int $limit = 5): array
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', $this->revenueStatuses())
            ->where('orders.created_at', '>=', $from)
            ->selectRaw('order_items.product_id, order_items.product_name as name, SUM(order_items.quantity) as quantity, SUM(order_items.line_total) as revenue')
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->toBase()
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id ? (int) $r->product_id : null,
                'name' => $r->name,
                'quantity' => (int) $r->quantity,
                'revenue' => (int) $r->revenue,
            ])
            ->all();
    }

    /**
     * @return array<string, int>
     */
    private function ordersByStatus(): array
    {
        $counts = Order::query()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->toBase()
            ->pluck('aggregate', 'status');

        $result = [];
        foreach (OrderStatus::cases() as $status) {
            $result[$status->value] = (int) ($counts[$status->value] ?? 0);
        }

        return $result;
    }

    private function percentChange(int $previous, int $current): ?float
    {
        if ($previous === 0) {
            return $current > 0 ? 100.0 : null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * @return list<string>
     */
    private function revenueStatuses(): array
    {
        return array_map(fn (OrderStatus $s) => $s->value, OrderStatus::revenue());
    }
}
