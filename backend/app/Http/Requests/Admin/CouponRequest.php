<?php

namespace App\Http\Requests\Admin;

use App\Enums\CouponType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        $coupon = $this->route('coupon');

        return $coupon
            ? $this->user()->can('update', $coupon)
            : $this->user()->can('create', \App\Models\Coupon::class);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
        }
    }

    public function rules(): array
    {
        $coupon = $this->route('coupon');
        $required = $coupon ? 'sometimes' : 'required';

        return [
            'code' => [$required, 'string', 'max:40', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'type' => [$required, Rule::enum(CouponType::class)],
            'value' => [
                $required, 'integer', 'min:1',
                Rule::when($this->input('type', $coupon?->type?->value) === CouponType::Percent->value, ['max:100']),
            ],
            'min_order_amount' => ['nullable', 'integer', 'min:0'],
            'max_discount' => ['nullable', 'integer', 'min:1'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', Rule::when($this->filled('starts_at'), ['after:starts_at'])],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
