<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Public, non-secret settings the storefront needs at boot.
 */
class ConfigController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'currency' => config('store.currency'),
                'payment_gateway' => config('store.payment_gateway'),
                'stripe_key' => config('store.payment_gateway') === 'stripe' ? config('services.stripe.key') : null,
                'shipping' => config('store.shipping'),
                'tax_rate' => config('store.tax_rate'),
            ],
        ]);
    }
}
