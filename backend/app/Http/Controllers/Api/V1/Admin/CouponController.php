<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class CouponController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Coupon::class);

        return CouponResource::collection(
            Coupon::query()
                ->when($request->filled('search'), fn ($q) => $q->where('code', 'like', '%'.strtoupper($request->string('search')->toString()).'%'))
                ->latest('id')
                ->paginate(20)
        );
    }

    public function store(CouponRequest $request): JsonResponse
    {
        $coupon = Coupon::query()->create($request->validated());

        return (new CouponResource($coupon))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Coupon $coupon): CouponResource
    {
        Gate::authorize('update', $coupon);

        return new CouponResource($coupon);
    }

    public function update(CouponRequest $request, Coupon $coupon): CouponResource
    {
        $coupon->update($request->validated());

        return new CouponResource($coupon);
    }

    public function destroy(Coupon $coupon): Response
    {
        Gate::authorize('delete', $coupon);

        // Orders keep coupon_code as a snapshot; coupon_id is nulled by the FK.
        $coupon->delete();

        return response()->noContent();
    }
}
