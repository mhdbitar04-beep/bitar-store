<?php

namespace App\Http\Requests\Checkout;

use Illuminate\Validation\Rule;

class CheckoutRequest extends CartQuoteRequest
{
    public function rules(): array
    {
        return parent::rules() + [
            'address_id' => [
                'nullable', 'integer',
                Rule::exists('addresses', 'id')->where('user_id', $this->user()->id),
            ],
            'shipping_address' => ['required_without:address_id', 'array'],
            'shipping_address.full_name' => ['required_without:address_id', 'string', 'max:255'],
            'shipping_address.phone' => ['required_without:address_id', 'string', 'max:30'],
            'shipping_address.line1' => ['required_without:address_id', 'string', 'max:255'],
            'shipping_address.line2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required_without:address_id', 'string', 'max:100'],
            'shipping_address.state' => ['nullable', 'string', 'max:100'],
            'shipping_address.postal_code' => ['required_without:address_id', 'string', 'max:20'],
            'shipping_address.country_code' => ['required_without:address_id', 'string', 'size:2'],
            'shipping_address.save' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
