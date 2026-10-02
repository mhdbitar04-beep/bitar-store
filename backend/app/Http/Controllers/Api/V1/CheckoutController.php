<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CheckoutController extends Controller
{
    public function __invoke(CheckoutRequest $request, CheckoutService $checkout): JsonResponse
    {
        ['order' => $order, 'client_secret' => $secret] = $checkout->checkout($request->user(), $request->validated());

        return response()->json([
            'data' => [
                'order' => new OrderResource($order->load('items')),
                'client_secret' => $secret,
            ],
        ], Response::HTTP_CREATED);
    }
}
