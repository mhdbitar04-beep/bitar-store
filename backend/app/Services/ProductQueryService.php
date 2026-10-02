<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Builds the public catalogue query from validated filter parameters.
 */
class ProductQueryService
{
    public const SORTS = ['newest', 'price_asc', 'price_desc', 'rating', 'popular', 'name'];

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? config('store.pagination.default')), (int) config('store.pagination.max'));

        return $this->query($filters)
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function query(array $filters): Builder
    {
        $query = Product::query()
            ->active()
            ->whereHas('category', fn (Builder $q) => $q->where('is_active', true))
            ->with(['category', 'primaryImage', 'activeVariants'])
            ->withCount(['images']);

        if (! empty($filters['search'])) {
            $term = '%'.addcslashes((string) $filters['search'], '%_\\').'%';
            $query->where(fn (Builder $q) => $q
                ->where('name', 'like', $term)
                ->orWhere('short_description', 'like', $term));
        }

        if (! empty($filters['category'])) {
            $query->whereIn('category_id', $this->categoryIdsFor((string) $filters['category']));
        }

        if (isset($filters['min_price'])) {
            $query->where('base_price', '>=', (int) $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('base_price', '<=', (int) $filters['max_price']);
        }

        if (! empty($filters['rating'])) {
            $query->where('rating_avg', '>=', (float) $filters['rating']);
        }

        if (! empty($filters['featured'])) {
            $query->featured();
        }

        if (! empty($filters['in_stock'])) {
            $query->whereHas('activeVariants', fn (Builder $q) => $q->where('stock', '>', 0));
        }

        match ($filters['sort'] ?? 'newest') {
            'price_asc' => $query->orderBy('base_price'),
            'price_desc' => $query->orderByDesc('base_price'),
            'rating' => $query->orderByDesc('rating_avg')->orderByDesc('reviews_count'),
            'popular' => $query->orderByDesc('sold_count'),
            'name' => $query->orderBy('name'),
            default => $query->latest(),
        };

        // Stable ordering so pagination never shows duplicates.
        return $query->orderByDesc('id');
    }

    /**
     * A parent category includes its children's products.
     *
     * @return list<int>
     */
    private function categoryIdsFor(string $slug): array
    {
        $category = Category::query()->active()->where('slug', $slug)->first();

        if (! $category) {
            return [];
        }

        return [$category->id, ...$category->children()->active()->pluck('id')->all()];
    }
}
