<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Order::class);

        $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $orders = Order::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
                $q->where(fn ($w) => $w->where('number', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', $term)->orWhere('name', 'like', $term)));
            })
            ->with(['user', 'latestPayment'])
            ->withCount('items')
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100))
            ->withQueryString();

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        return new OrderResource($order->load(['user', 'items.product', 'statusHistories', 'latestPayment']));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order, OrderService $orders): OrderResource
    {
        $order = $orders->transition(
            $order,
            OrderStatus::from($request->validated('status')),
            $request->user(),
            $request->validated('note'),
        );

        return new OrderResource($order->load(['user', 'items.product', 'statusHistories', 'latestPayment']));
    }
}
