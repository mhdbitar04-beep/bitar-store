<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\CartQuoteRequest;
use App\Services\Cart\CartPricingService;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    /**
     * Re-prices the client-side cart with live prices, stock and coupon rules.
     */
    public function quote(CartQuoteRequest $request, CartPricingService $pricing): JsonResponse
    {
        $quote = $pricing->quote(
            $request->validated('items'),
            $request->validated('coupon_code'),
            auth('sanctum')->user(),
        );

        return response()->json(['data' => $quote->toArray()]);
    }
}
