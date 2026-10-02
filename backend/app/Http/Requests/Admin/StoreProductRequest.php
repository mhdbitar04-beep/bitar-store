<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Product::class);
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:10000'],
            'base_price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'compare_at_price' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            // Simple product: stock on the single default variant.
            'stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            // Product with options: explicit variants.
            'variants' => ['nullable', 'array', 'max:100'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.sku' => ['nullable', 'string', 'max:64', 'distinct'],
            'variants.*.price' => ['nullable', 'integer', 'min:0'],
            'variants.*.stock' => ['required_with:variants', 'integer', 'min:0'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
            'variants.*.attribute_value_ids' => ['nullable', 'array'],
            'variants.*.attribute_value_ids.*' => ['integer', 'exists:attribute_values,id'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                foreach ((array) $this->input('variants', []) as $i => $variant) {
                    if (empty($variant['sku'])) {
                        continue;
                    }

                    $exists = \App\Models\ProductVariant::query()
                        ->where('sku', $variant['sku'])
                        ->when(! empty($variant['id']), fn ($q) => $q->whereKeyNot($variant['id']))
                        ->exists();

                    if ($exists) {
                        $validator->errors()->add("variants.{$i}.sku", 'This SKU is already in use.');
                    }
                }
            },
        ];
    }
}
