<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AddressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return AddressResource::collection(
            $request->user()->addresses()->orderByDesc('is_default')->latest()->get()
        );
    }

    public function store(AddressRequest $request): AddressResource
    {
        $user = $request->user();

        $address = DB::transaction(function () use ($user, $request) {
            $data = $request->validated();
            $data['is_default'] = ($data['is_default'] ?? false) || ! $user->addresses()->exists();

            if ($data['is_default']) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create($data);
        });

        return new AddressResource($address);
    }

    public function update(AddressRequest $request, Address $address): AddressResource
    {
        Gate::authorize('update', $address);

        DB::transaction(function () use ($request, $address) {
            if ($request->boolean('is_default')) {
                $request->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            }

            $address->update($request->validated());
        });

        return new AddressResource($address);
    }

    public function destroy(Address $address): Response
    {
        Gate::authorize('delete', $address);

        $address->delete();

        return response()->noContent();
    }
}
