<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    /**
     * @param  array{rating: int, title?: ?string, body: string}  $data
     */
    public function create(User $user, Product $product, array $data): Review
    {
        if ($product->reviews()->where('user_id', $user->id)->exists()) {
            throw new BusinessException('You have already reviewed this product.', 'already_reviewed', 409);
        }

        return DB::transaction(function () use ($user, $product, $data) {
            $review = new Review($data);
            $review->user()->associate($user);
            $review->product()->associate($product);
            $review->is_verified_purchase = $user->hasPurchased($product);
            $review->is_approved = true;
            $review->save();

            $this->refreshRating($product);

            return $review;
        });
    }

    public function delete(Review $review): void
    {
        DB::transaction(function () use ($review) {
            $product = $review->product;
            $review->delete();
            $this->refreshRating($product);
        });
    }

    /**
     * Keep the cached aggregate columns in sync (used for filtering & sorting by rating).
     */
    public function refreshRating(Product $product): void
    {
        $count = $product->approvedReviews()->count();
        $average = $count > 0 ? (float) $product->approvedReviews()->avg('rating') : 0.0;

        $product->forceFill([
            'reviews_count' => $count,
            'rating_avg' => round($average, 2),
        ])->saveQuietly();
    }
}
