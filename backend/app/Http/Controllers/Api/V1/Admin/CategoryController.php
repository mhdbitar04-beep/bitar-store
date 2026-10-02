<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Category::class);

        return CategoryResource::collection(
            Category::query()->withCount('products')->orderBy('parent_id')->orderBy('sort_order')->get()
        );
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = new Category(Arr::except($request->validated(), ['image']));

        if ($request->hasFile('image')) {
            $category->image_path = $request->file('image')->store('categories', 'public');
        }

        $category->save();

        return (new CategoryResource($category))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $category->fill(Arr::except($request->validated(), ['image']));

        if ($request->hasFile('image')) {
            if ($category->image_path && ! str_starts_with($category->image_path, 'http')) {
                Storage::disk('public')->delete($category->image_path);
            }
            $category->image_path = $request->file('image')->store('categories', 'public');
        }

        $category->save();

        return new CategoryResource($category->loadCount('products'));
    }

    public function destroy(Category $category): Response
    {
        Gate::authorize('delete', $category);

        if ($category->products()->withTrashed()->exists()) {
            throw new BusinessException(
                'This category still has products. Move or delete them first.',
                'category_not_empty',
                409,
            );
        }

        $category->delete();

        return response()->noContent();
    }
}
