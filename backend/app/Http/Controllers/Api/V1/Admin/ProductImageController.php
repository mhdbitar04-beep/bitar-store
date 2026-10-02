<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadProductImagesRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ProductImageController extends Controller
{
    public function __construct(private readonly ProductService $products) {}

    public function store(UploadProductImagesRequest $request, Product $product): JsonResponse
    {
        $images = $this->products->addImages($product, $request->file('images'));

        return ProductImageResource::collection(collect($images))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function makePrimary(ProductImage $image): ProductImageResource
    {
        Gate::authorize('update', $image->product);

        $this->products->setPrimaryImage($image);

        return new ProductImageResource($image->refresh());
    }

    public function destroy(ProductImage $image): Response
    {
        Gate::authorize('update', $image->product);

        $this->products->deleteImage($image);

        return response()->noContent();
    }
}
