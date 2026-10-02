<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ProductIndexRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductQueryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(ProductIndexRequest $request, ProductQueryService $products): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $query = $products->query($filters);

        // Optional auth: logged-in shoppers see their wishlist hearts filled.
        if ($user = auth('sanctum')->user()) {
            $query->withExists(['wishlistedBy as is_wishlisted' => fn ($q) => $q->whereKey($user->id)]);
        }

        $perPage = min((int) ($filters['per_page'] ?? config('store.pagination.default')), (int) config('store.pagination.max'));

        return ProductResource::collection($query->paginate($perPage)->withQueryString());
    }

    public function show(Request $request, Product $product): ProductResource
    {
        abort_unless($product->is_active, 404);

        $product->load([
            'category',
            'images',
            'primaryImage',
            'activeVariants.attributeValues.attribute',
        ]);

        if ($user = auth('sanctum')->user()) {
            $product->setAttribute('is_wishlisted', $product->wishlistedBy()->whereKey($user->id)->exists());
        }

        return new ProductResource($product);
    }

    /**
     * "You may also like": same category, best rated.
     */
    public function related(Product $product): AnonymousResourceCollection
    {
        $related = Product::query()
            ->active()
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->with(['primaryImage', 'activeVariants', 'category'])
            ->orderByDesc('rating_avg')
            ->limit(4)
            ->get();

        return ProductResource::collection($related);
    }
}
