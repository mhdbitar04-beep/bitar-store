<?php

namespace App\Http\Resources;

use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/** @mixin \App\Models\Product */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $variants = $this->loadedVariants();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'base_price' => $this->base_price,
            'compare_at_price' => $this->compare_at_price,
            'price_min' => $variants?->map->effectivePrice()->min() ?? $this->base_price,
            'price_max' => $variants?->map->effectivePrice()->max() ?? $this->base_price,
            'total_stock' => $variants ? (int) $variants->where('is_active', true)->sum('stock') : null,
            'in_stock' => $variants ? $variants->where('is_active', true)->contains(fn ($v) => $v->stock > 0) : null,
            'rating_avg' => round((float) $this->rating_avg, 1),
            'reviews_count' => $this->reviews_count,
            'sold_count' => $this->sold_count,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'is_wishlisted' => $this->when(isset($this->is_wishlisted), fn () => (bool) $this->is_wishlisted),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'primary_image' => new ProductImageResource($this->whenLoaded('primaryImage')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => $variants ? VariantResource::collection($variants) : $this->when(false, null),
            'options' => $this->when($variants !== null && $this->variantsHaveAttributes($variants), fn () => $this->options($variants)),
            'created_at' => $this->created_at?->toIso8601String(),
            'deleted_at' => $this->when($this->deleted_at !== null, fn () => $this->deleted_at?->toIso8601String()),
        ];
    }

    /**
     * Admin endpoints load "variants", the storefront loads "activeVariants".
     *
     * @return Collection<int, ProductVariant>|null
     */
    private function loadedVariants(): ?Collection
    {
        $relation = match (true) {
            $this->relationLoaded('variants') => 'variants',
            $this->relationLoaded('activeVariants') => 'activeVariants',
            default => null,
        };

        if ($relation === null) {
            return null;
        }

        // Give every variant its parent so effectivePrice() doesn't trigger extra queries.
        return $this->resource->{$relation}->each(fn (ProductVariant $v) => $v->setRelation('product', $this->resource));
    }

    private function variantsHaveAttributes(Collection $variants): bool
    {
        return $variants->contains(fn (ProductVariant $v) => $v->relationLoaded('attributeValues') && $v->attributeValues->isNotEmpty());
    }

    /**
     * Groups variant attribute values for the option pickers, e.g.
     * [{ attribute: {name: "Color"}, values: [{value: "Black"}, ...] }, ...]
     *
     * @return list<array<string, mixed>>
     */
    private function options(Collection $variants): array
    {
        return $variants
            ->flatMap(fn (ProductVariant $v) => $v->attributeValues)
            ->unique('id')
            ->groupBy('attribute_id')
            ->map(function (Collection $values) {
                $attribute = $values->first()->attribute;

                return [
                    'attribute' => [
                        'id' => $attribute->id,
                        'name' => $attribute->name,
                        'slug' => $attribute->slug,
                        'type' => $attribute->type->value,
                    ],
                    'values' => $values->sortBy('sort_order')->map(fn ($v) => [
                        'id' => $v->id,
                        'value' => $v->value,
                        'color_hex' => $v->color_hex,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }
}
