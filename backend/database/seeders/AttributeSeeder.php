<?php

namespace Database\Seeders;

use App\Enums\AttributeType;
use App\Models\Attribute;
use Illuminate\Database\Seeder;

class AttributeSeeder extends Seeder
{
    public const COLORS = [
        'Black' => '#0B0B0B',
        'Gold' => '#D4AF37',
        'Silver' => '#C0C0C0',
        'White' => '#F5F5F0',
        'Navy' => '#1F2A44',
        'Brown' => '#6B4423',
        'Rose' => '#E8B4B8',
    ];

    public function run(): void
    {
        $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color', 'type' => AttributeType::Color]);
        $i = 0;
        foreach (self::COLORS as $name => $hex) {
            $color->values()->create(['value' => $name, 'color_hex' => $hex, 'sort_order' => $i++]);
        }

        $this->select('Size', 'size', ['39', '40', '41', '42', '43', '44', '45']);
        $this->select('Storage', 'storage', ['128GB', '256GB', '512GB', '1TB']);
        $this->select('Volume', 'volume', ['50ml', '100ml', '150ml']);
    }

    /**
     * @param  list<string>  $values
     */
    private function select(string $name, string $slug, array $values): void
    {
        $attribute = Attribute::query()->create(['name' => $name, 'slug' => $slug, 'type' => AttributeType::Select]);

        foreach ($values as $i => $value) {
            $attribute->values()->create(['value' => $value, 'sort_order' => $i]);
        }
    }
}
