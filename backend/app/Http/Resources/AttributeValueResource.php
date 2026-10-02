<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AttributeValue */
class AttributeValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'value' => $this->value,
            'color_hex' => $this->color_hex,
            'attribute_id' => $this->attribute_id,
            'attribute' => $this->whenLoaded('attribute', fn () => [
                'id' => $this->attribute->id,
                'name' => $this->attribute->name,
                'slug' => $this->attribute->slug,
                'type' => $this->attribute->type->value,
            ]),
        ];
    }
}
