<?php

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'allowed_transitions' => array_map(fn (OrderStatus $s) => $s->value, $this->status->allowedTransitions()),
            'subtotal' => $this->subtotal,
            'discount_total' => $this->discount_total,
            'shipping_total' => $this->shipping_total,
            'tax_total' => $this->tax_total,
            'total' => $this->total,
            'currency' => $this->currency,
            'coupon_code' => $this->coupon_code,
            'shipping_address' => $this->shipping_address,
            'notes' => $this->notes,
            'items_count' => $this->whenCounted('items'),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'history' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'payment' => $this->whenLoaded('latestPayment', fn () => $this->latestPayment ? [
                'provider' => $this->latestPayment->provider,
                'status' => $this->latestPayment->status->value,
            ] : null),
            'customer' => new UserResource($this->whenLoaded('user')),
            'can_cancel' => $this->status === OrderStatus::Pending,
            'can_pay' => $this->status === OrderStatus::Pending,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
