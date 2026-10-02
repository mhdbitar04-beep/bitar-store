<?php

namespace App\Http\Requests\Admin;

class UpdateProductRequest extends StoreProductRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        $rules = parent::rules();

        // Partial updates: every top-level field becomes optional.
        foreach (['category_id', 'name', 'base_price'] as $field) {
            $rules[$field] = array_merge(['sometimes'], $rules[$field]);
        }

        unset($rules['images'], $rules['images.*']);

        return $rules;
    }
}
