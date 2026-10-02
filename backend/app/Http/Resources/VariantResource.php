<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ProductVariant */
class VariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'price' => $this->relationLoaded('product') ? $this->effectivePrice() : $this->price,
            'price_override' => $this->price,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'is_default' => $this->is_default,
            'is_active' => $this->is_active,
            'label' => $this->whenLoaded('attributeValues', fn () => $this->label()),
            'attribute_values' => AttributeValueResource::collection($this->whenLoaded('attributeValues')),
        ];
    }
}
