<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'label', 'full_name', 'phone', 'line1', 'line2',
        'city', 'state', 'postal_code', 'country_code', 'is_default',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Plain array used as an immutable snapshot on orders.
     *
     * @return array<string, mixed>
     */
    public function toSnapshot(): array
    {
        return $this->only([
            'full_name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code', 'country_code',
        ]);
    }
}
