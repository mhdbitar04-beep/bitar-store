<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\Payments\PaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()->orders()
            ->withCount('items')
            ->with('items')
            ->latest()
            ->paginate(10);

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        return new OrderResource($order->load(['items.product', 'statusHistories', 'latestPayment']));
    }

    public function cancel(Request $request, Order $order): OrderResource
    {
        Gate::authorize('cancel', $order);

        $order = $this->orders->cancelByCustomer($order, $request->user());

        return new OrderResource($order->load(['items', 'statusHistories', 'latestPayment']));
    }

    /**
     * Resume payment of an unpaid order (e.g. the customer closed the tab).
     */
    public function pay(Order $order, PaymentGateway $gateway): JsonResponse
    {
        Gate::authorize('pay', $order);

        if ($order->status !== OrderStatus::Pending) {
            throw new BusinessException('This order is not awaiting payment.', 'order_not_payable');
        }

        $payment = $order->payments()->latest('id')->firstOrFail();

        return response()->json([
            'data' => [
                'order' => new OrderResource($order->load('items')),
                'client_secret' => $gateway->clientSecretFor($payment->provider_payment_id),
            ],
        ]);
    }

    /**
     * Offline demo only (PAYMENT_GATEWAY=fake): behaves like a successful Stripe webhook.
     */
    public function simulatePayment(Order $order): OrderResource
    {
        Gate::authorize('pay', $order);

        abort_unless(config('store.payment_gateway') === 'fake' && ! app()->isProduction(), 404);

        $payment = $order->payments()->latest('id')->firstOrFail();
        $this->orders->markPaid($payment, ['simulated' => true]);

        return new OrderResource($order->refresh()->load(['items', 'statusHistories', 'latestPayment']));
    }
}
