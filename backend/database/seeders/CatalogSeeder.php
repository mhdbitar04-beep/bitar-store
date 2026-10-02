<?php

namespace Database\Seeders;

use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Product;
use App\Support\DemoImages;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * A realistic multi-category catalogue. Prices are in cents.
 * Photos come from public/images/products (see App\Support\DemoImages).
 */
class CatalogSeeder extends Seeder
{
    private const FEATURED = [
        'Aurum X Pro', 'Titan Pro 16', 'Noir ANC Headphones', 'Regal Chronograph',
        'Oud Royale Eau de Parfum', 'Milano Leather Tote', 'Air Court High Sneakers', 'Shea Butter Body Wash',
    ];

    public function run(): void
    {
        $values = AttributeValue::query()->with('attribute')->get()
            ->groupBy(fn (AttributeValue $v) => $v->attribute->slug)
            ->map(fn (Collection $group) => $group->keyBy('value'));

        foreach ($this->catalog() as $sort => $parentData) {
            $parent = Category::query()->create([
                'name' => $parentData['name'],
                'slug' => Str::slug($parentData['name']),
                'description' => $parentData['description'],
                'image_path' => 'placeholder/'.Str::slug($parentData['name']).'-cat.svg',
                'sort_order' => $sort,
            ]);

            foreach ($parentData['children'] as $childSort => $child) {
                $category = Category::query()->create([
                    'parent_id' => $parent->id,
                    'name' => $child['name'],
                    'slug' => Str::slug($child['name']),
                    'description' => $child['description'],
                    'image_path' => 'placeholder/'.Str::slug($child['name']).'-cat.svg',
                    'sort_order' => $childSort,
                ]);

                foreach ($child['products'] as [$name, $price, $short]) {
                    $this->createProduct($category, $name, $price, $short, $child['options'] ?? [], $child['step'] ?? 0, $values);
                }

                // A category is represented by the first photo of its first product.
                $category->update(['image_path' => DemoImages::pathsFor(Str::slug($child['products'][0][0]))[0]]);
            }

            $parent->update(['image_path' => $parent->children()->orderBy('sort_order')->value('image_path')]);
        }
    }

    /**
     * @param  array<string, list<string>>  $options  attribute slug => values
     * @param  Collection<string, Collection<string, AttributeValue>>  $values
     */
    private function createProduct(Category $category, string $name, int $price, string $short, array $options, int $step, Collection $values): void
    {
        $slug = Str::slug($name);

        $product = Product::query()->create([
            'category_id' => $category->id,
            'name' => $name,
            'slug' => $slug,
            'short_description' => $short,
            'description' => $this->description($name, $short),
            'base_price' => $price,
            'compare_at_price' => fake()->boolean(35) ? (int) (round($price * 1.25 / 100) * 100 - 1) : null,
            'is_active' => true,
            'is_featured' => in_array($name, self::FEATURED, true),
        ]);

        // Real photos when downloaded (php artisan store:download-images), else placeholders.
        foreach (DemoImages::pathsFor($slug) as $index => $path) {
            $product->images()->create([
                'path' => $path,
                'alt' => $name.' — image '.($index + 1),
                'sort_order' => $index + 1,
                'is_primary' => $index === 0,
            ]);
        }

        if ($options === []) {
            $product->variants()->create([
                'sku' => $this->sku($name),
                'stock' => fake()->numberBetween(0, 60),
                'is_default' => true,
            ]);

            return;
        }

        // Cartesian product of all option values → one variant per combination.
        $combinations = [[]];
        foreach ($options as $attribute => $list) {
            $next = [];
            foreach ($combinations as $combo) {
                foreach ($list as $index => $value) {
                    $next[] = $combo + [$attribute => [$value, $index]];
                }
            }
            $combinations = $next;
        }

        foreach ($combinations as $i => $combo) {
            // The priced option (storage / volume) raises the price per step.
            $priceStep = collect($combo)->only(['storage', 'volume'])->sum(fn ($pair) => $pair[1]);

            $variant = $product->variants()->create([
                'sku' => $this->sku($name, implode('-', Arr::pluck($combo, 0))),
                'price' => $priceStep > 0 ? $price + $priceStep * $step : null,
                'stock' => fake()->boolean(12) ? 0 : fake()->numberBetween(1, 40),
                'is_default' => $i === 0,
            ]);

            $variant->attributeValues()->sync(
                collect($combo)->map(fn ($pair, $attribute) => $values[$attribute][$pair[0]]->id)->values()->all()
            );
        }
    }

    private function sku(string $name, string $suffix = ''): string
    {
        $base = Str::upper(Str::limit(Str::slug($name, ''), 6, ''));

        return trim($base.'-'.Str::upper(Str::slug($suffix, '')).'-'.Str::upper(Str::random(3)), '-');
    }

    private function description(string $name, string $short): string
    {
        return "{$short}\n\n{$name} is crafted for people who value detail. Every piece is inspected by hand "
            ."before it leaves our warehouse, and it ships in BITAR STORE's signature black-and-gold packaging.\n\n"
            ."• Premium materials and finish\n• 2-year warranty\n• Free returns within 30 days";
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function catalog(): array
    {
        return [
            [
                'name' => 'Electronics',
                'description' => 'Flagship phones, laptops and audio.',
                'children' => [
                    [
                        'name' => 'Smartphones',
                        'description' => 'The latest flagship and compact phones.',
                        'options' => ['color' => ['Black', 'Silver', 'Gold'], 'storage' => ['128GB', '256GB', '512GB']],
                        'step' => 10000,
                        'products' => [
                            ['Aurum X Pro', 99900, 'Titanium frame, 6.7" OLED and a triple 48MP camera system.'],
                            ['Nova S24 Ultra', 119900, 'Built-in stylus, 200MP camera and all-day battery.'],
                            ['Pixelite 9', 79900, 'Clean software, brilliant computational photography.'],
                            ['Onyx Mini', 59900, 'Flagship power in a pocket-friendly 5.4" body.'],
                        ],
                    ],
                    [
                        'name' => 'Laptops',
                        'description' => 'Ultrabooks and pro workstations.',
                        'options' => ['color' => ['Black', 'Silver'], 'storage' => ['256GB', '512GB', '1TB']],
                        'step' => 20000,
                        'products' => [
                            ['Bitar Book Air 14', 129900, 'Fanless, 1.2 kg, 18-hour battery life.'],
                            ['Titan Pro 16', 229900, '16" mini-LED display and a desktop-class GPU.'],
                            ['Zen Slim 13', 89900, 'Lightweight everyday laptop with a crisp 2.5K screen.'],
                        ],
                    ],
                    [
                        'name' => 'Audio',
                        'description' => 'Headphones, earbuds and speakers.',
                        'options' => ['color' => ['Black', 'White', 'Gold']],
                        'products' => [
                            ['Noir ANC Headphones', 34900, 'Adaptive noise cancelling with 40 hours of playback.'],
                            ['Aura Buds Pro', 19900, 'True wireless earbuds with spatial audio.'],
                            ['Echo Smart Speaker', 14900, 'Room-filling sound with a built-in smart home hub.'],
                            ['Pulse Portable Speaker', 12900, 'Waterproof, rugged, 24-hour battery.'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Fashion',
                'description' => 'Shoes, bags and timepieces.',
                'children' => [
                    [
                        'name' => 'Shoes',
                        'description' => 'Sneakers, trainers and performance footwear.',
                        'options' => ['size' => ['40', '41', '42', '43', '44']],
                        'products' => [
                            ['Air Court High Sneakers', 18900, 'Iconic high-top silhouette in premium leather.'],
                            ['Runner Elite Trainers', 12900, 'Responsive foam and a breathable retro upper.'],
                            ['Street Sport Sneakers', 9900, 'Lightweight everyday sneaker with a cushioned sole.'],
                            ['Pro Field Cleats', 14900, 'Molded studs for grip and stability on the field.'],
                        ],
                    ],
                    [
                        'name' => 'Bags',
                        'description' => 'Totes, crossbodies and travel bags.',
                        'products' => [
                            ['Milano Leather Tote', 24900, 'Full-grain leather tote with gold hardware.'],
                            ['Monaco Crossbody', 15900, 'Compact crossbody with adjustable chain strap.'],
                            ['Ivory Leather Backpack', 19900, 'Soft ivory leather backpack with a roomy interior.'],
                        ],
                    ],
                    [
                        'name' => 'Watches',
                        'description' => 'Automatic, chronograph and minimalist watches.',
                        'options' => ['color' => ['Black', 'Gold', 'Silver']],
                        'products' => [
                            ['Regal Chronograph', 45900, 'Sapphire crystal, 100 m water resistance.'],
                            ['Heritage Automatic', 69900, 'Swiss automatic movement with exhibition caseback.'],
                            ['Classic Leather Watch', 17900, 'Slim case with a hand-stitched brown leather strap.'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Beauty',
                'description' => 'Fragrances and skincare.',
                'children' => [
                    [
                        'name' => 'Fragrances',
                        'description' => 'Eau de parfum for every mood.',
                        'options' => ['volume' => ['50ml', '100ml']],
                        'step' => 4000,
                        'products' => [
                            ['Oud Royale Eau de Parfum', 14900, 'Smoky oud, saffron and rose.'],
                            ['Amber Noir', 12900, 'Warm amber, vanilla and black pepper.'],
                            ['Golden Hour', 9900, 'Bergamot, neroli and white musk.'],
                            ['Velvet Rose', 11900, 'Damask rose with a soft patchouli base.'],
                        ],
                    ],
                    [
                        'name' => 'Skincare',
                        'description' => 'Everyday care for hands, face and body.',
                        'products' => [
                            ['Botanical Hand Wash', 1900, 'Plant-based hand wash with a fresh leaf scent.'],
                            ['Shea Butter Body Wash', 2400, 'Ultra-moisturising body wash with shea butter.'],
                            ['Daily Face and Body Lotion', 2900, 'Fast-absorbing lotion for all-day hydration.'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Home & Living',
                'description' => 'Décor and kitchen essentials.',
                'children' => [
                    [
                        'name' => 'Decor',
                        'description' => 'Lighting and greenery for a warmer home.',
                        'products' => [
                            ['Aurora Table Lamp', 7900, 'Warm ambient lamp with a sculpted base.'],
                            ['Ceramic Plant Pot', 3900, 'Hand-glazed ceramic pot for indoor plants.'],
                            ['Evergreen Showpiece Plant', 5900, 'Lifelike decorative plant that never needs water.'],
                        ],
                    ],
                    [
                        'name' => 'Kitchen',
                        'description' => 'Tools for people who love to cook.',
                        'products' => [
                            ['Power Blender', 12900, '1200 W motor with six stainless-steel blades.'],
                            ['Steel Cooking Pot', 6900, 'Stainless-steel pot with a tempered glass lid.'],
                            ['Compact Microwave Oven', 19900, '20 L capacity with ten power levels and grill.'],
                        ],
                    ],
                ],
            ],
        ];
    }
}
