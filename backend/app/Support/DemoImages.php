<?php

namespace App\Support;

/**
 * Real product photos for the demo catalogue.
 *
 * `php artisan store:download-images` downloads them once from the DummyJSON CDN
 * (free demo imagery) into public/images/products, so they are committed with the
 * project and the store never depends on an external host at runtime.
 * If a photo is missing, the generated placeholder artwork is used instead.
 */
final class DemoImages
{
    public const CDN = 'https://cdn.dummyjson.com/product-images/';

    public const DIRECTORY = 'images/products';

    /** Product slug => [source folder on the CDN, number of photos]. */
    public const SOURCES = [
        // Smartphones
        'aurum-x-pro' => ['smartphones/iphone-13-pro', 3],
        'nova-s24-ultra' => ['smartphones/samsung-galaxy-s10', 3],
        'pixelite-9' => ['smartphones/realme-xt', 3],
        'onyx-mini' => ['smartphones/iphone-x', 3],
        // Laptops
        'bitar-book-air-14' => ['laptops/apple-macbook-pro-14-inch-space-grey', 3],
        'titan-pro-16' => ['laptops/asus-zenbook-pro-dual-screen-laptop', 3],
        'zen-slim-13' => ['laptops/huawei-matebook-x-pro', 3],
        // Audio
        'noir-anc-headphones' => ['mobile-accessories/apple-airpods-max-silver', 1],
        'aura-buds-pro' => ['mobile-accessories/apple-airpods', 3],
        'echo-smart-speaker' => ['mobile-accessories/amazon-echo-plus', 2],
        'pulse-portable-speaker' => ['mobile-accessories/apple-homepod-mini-cosmic-grey', 1],
        // Shoes
        'air-court-high-sneakers' => ['mens-shoes/nike-air-jordan-1-red-and-black', 3],
        'runner-elite-trainers' => ['mens-shoes/puma-future-rider-trainers', 3],
        'street-sport-sneakers' => ['mens-shoes/sports-sneakers-off-white-red', 3],
        'pro-field-cleats' => ['mens-shoes/nike-baseball-cleats', 3],
        // Bags
        'milano-leather-tote' => ['womens-bags/prada-women-bag', 3],
        'monaco-crossbody' => ['womens-bags/women-handbag-black', 3],
        'ivory-leather-backpack' => ['womens-bags/white-faux-leather-backpack', 3],
        // Watches
        'regal-chronograph' => ['mens-watches/rolex-submariner-watch', 3],
        'heritage-automatic' => ['mens-watches/longines-master-collection', 3],
        'classic-leather-watch' => ['mens-watches/brown-leather-belt-watch', 3],
        // Fragrances
        'oud-royale-eau-de-parfum' => ['fragrances/chanel-coco-noir-eau-de', 3],
        'amber-noir' => ['fragrances/calvin-klein-ck-one', 3],
        'golden-hour' => ['fragrances/dolce-shine-eau-de', 3],
        'velvet-rose' => ['fragrances/gucci-bloom-eau-de', 3],
        // Skincare
        'botanical-hand-wash' => ['skin-care/attitude-super-leaves-hand-soap', 3],
        'shea-butter-body-wash' => ['skin-care/olay-ultra-moisture-shea-butter-body-wash', 3],
        'daily-face-and-body-lotion' => ['skin-care/vaseline-men-body-and-face-lotion', 3],
        // Decor
        'aurora-table-lamp' => ['home-decoration/table-lamp', 1],
        'ceramic-plant-pot' => ['home-decoration/plant-pot', 3],
        'evergreen-showpiece-plant' => ['home-decoration/house-showpiece-plant', 3],
        // Kitchen
        'power-blender' => ['kitchen-accessories/boxed-blender', 3],
        'steel-cooking-pot' => ['kitchen-accessories/silver-pot-with-glass-cap', 1],
        'compact-microwave-oven' => ['kitchen-accessories/microwave-oven', 3],
    ];

    public static function localPath(string $slug, int $index): string
    {
        return self::DIRECTORY."/{$slug}-{$index}.webp";
    }

    public static function remoteUrl(string $slug, int $index): ?string
    {
        $source = self::SOURCES[$slug] ?? null;

        return $source ? self::CDN.$source[0]."/{$index}.webp" : null;
    }

    /**
     * Image paths to store for a product: downloaded photos when present,
     * otherwise generated placeholders.
     *
     * @return list<string>
     */
    public static function pathsFor(string $slug): array
    {
        $count = self::SOURCES[$slug][1] ?? 3;
        $paths = [];

        for ($i = 1; $i <= $count; $i++) {
            $local = self::localPath($slug, $i);
            $paths[] = is_file(public_path($local)) ? $local : "placeholder/{$slug}-{$i}.svg";
        }

        return $paths;
    }
}
