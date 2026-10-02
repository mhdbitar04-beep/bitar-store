<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $products) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Product::class);

        $products = Product::query()
            ->when($request->boolean('trashed'), fn ($q) => $q->onlyTrashed())
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhereHas('variants', fn ($v) => $v->where('sku', 'like', $term)));
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->with(['category', 'primaryImage', 'variants'])
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100))
            ->withQueryString();

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->products->create($request->validated(), $request->file('images', []));

        return (new ProductResource($this->loadForAdmin($product)))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Product $product): ProductResource
    {
        Gate::authorize('update', $product);

        return new ProductResource($this->loadForAdmin($product));
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product = $this->products->update($product, $request->validated());

        return new ProductResource($this->loadForAdmin($product));
    }

    public function destroy(Product $product): Response
    {
        Gate::authorize('delete', $product);

        $this->products->delete($product);

        return response()->noContent();
    }

    private function loadForAdmin(Product $product): Product
    {
        return $product->load(['category', 'images', 'primaryImage', 'variants.attributeValues.attribute']);
    }
}
