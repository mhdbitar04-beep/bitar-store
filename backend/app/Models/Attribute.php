<?php

namespace App\Models;

use App\Enums\AttributeType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A product option dimension such as "Color", "Size" or "Storage".
 */
class Attribute extends Model
{
    protected $fillable = ['name', 'slug', 'type'];

    protected function casts(): array
    {
        return ['type' => AttributeType::class];
    }

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class)->orderBy('sort_order');
    }
}
