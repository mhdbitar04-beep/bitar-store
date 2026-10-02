<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\StripeWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeWebhookService $webhooks): JsonResponse
    {
        // Raw body is required: re-encoding the JSON would break the signature.
        $result = $webhooks->handle($request->getContent(), $request->header('Stripe-Signature'));

        return response()->json(['received' => true, 'result' => $result]);
    }
}
