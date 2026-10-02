<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Support\PlaceholderArt;
use Illuminate\Http\Response;

/**
 * Serves locally generated black & gold demo artwork, so the catalogue never depends
 * on an external image host. Seeds look like "{product-slug}-{1..3}" or "{category-slug}-cat";
 * the illustration (phone, shoe, watch…) is chosen from the product's category.
 */
class PlaceholderImageController extends Controller
{
    public function __invoke(string $seed): Response
    {
        [$categorySlug, $variant] = $this->resolve($seed);

        $svg = PlaceholderArt::svg(PlaceholderArt::typeFor($categorySlug), $seed, $variant);

        return response($svg, 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * @return array{0: ?string, 1: int} category slug and view variant
     */
    private function resolve(string $seed): array
    {
        if (str_ends_with($seed, '-cat')) {
            $slug = substr($seed, 0, -4);

            return [Category::query()->where('slug', $slug)->value('slug'), 1];
        }

        if (preg_match('/^(.+)-([1-9])$/', $seed, $m)) {
            $categorySlug = Product::withTrashed()
                ->where('products.slug', $m[1])
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->value('categories.slug');

            return [$categorySlug, (int) $m[2]];
        }

        return [null, 1];
    }
}
