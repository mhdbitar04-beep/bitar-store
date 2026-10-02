<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviews) {}

    public function index(Product $product): AnonymousResourceCollection
    {
        $reviews = $product->approvedReviews()
            ->with('user:id,name')
            ->latest()
            ->paginate(5);

        // Rating distribution for the "5★ ████ 60%" bars.
        $distribution = $product->approvedReviews()
            ->selectRaw('rating, COUNT(*) as aggregate')
            ->groupBy('rating')
            ->pluck('aggregate', 'rating');

        return ReviewResource::collection($reviews)->additional([
            'summary' => [
                'average' => round((float) $product->rating_avg, 1),
                'count' => $product->reviews_count,
                'distribution' => collect(range(5, 1))->mapWithKeys(fn ($r) => [$r => (int) ($distribution[$r] ?? 0)]),
            ],
        ]);
    }

    public function store(StoreReviewRequest $request, Product $product): JsonResponse
    {
        abort_unless($product->is_active, 404);

        $review = $this->reviews->create($request->user(), $product, $request->validated());

        return (new ReviewResource($review->load('user:id,name')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Review $review): Response
    {
        Gate::authorize('delete', $review);

        $this->reviews->delete($review);

        return response()->noContent();
    }
}
