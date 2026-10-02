<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = ['sku', 'price', 'stock', 'is_default', 'is_active'];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'stock' => 'integer',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(AttributeValue::class)->with('attribute');
    }

    /**
     * Variant price falls back to the product's base price.
     */
    public function effectivePrice(): int
    {
        return $this->price ?? $this->product->base_price;
    }

    /**
     * Human label such as "Black / 42". Empty for the default single variant.
     */
    public function label(): ?string
    {
        $values = $this->attributeValues->pluck('value');

        return $values->isEmpty() ? null : $values->implode(' / ');
    }
}
