<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WishlistController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $request->user()->wishlist()
            ->active()
            ->with(['primaryImage', 'activeVariants', 'category'])
            ->orderByPivot('created_at', 'desc')
            ->get()
            ->each(fn (Product $p) => $p->setAttribute('is_wishlisted', true));

        return ProductResource::collection($products);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        abort_unless($product->is_active, 404);

        $request->user()->wishlist()->syncWithoutDetaching([$product->id]);

        return response()->json(['data' => ['product_id' => $product->id, 'is_wishlisted' => true]], 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlist()->detach($product->id);

        return response()->json(['data' => ['product_id' => $product->id, 'is_wishlisted' => false]]);
    }
}
