<?php

namespace App\Http\Requests\Catalog;

use App\Services\ProductQueryService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0', 'gte:min_price'],
            'rating' => ['nullable', 'numeric', 'between:1,5'],
            'featured' => ['nullable', 'boolean'],
            'in_stock' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(ProductQueryService::SORTS)],
            'per_page' => ['nullable', 'integer', 'between:1,48'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
