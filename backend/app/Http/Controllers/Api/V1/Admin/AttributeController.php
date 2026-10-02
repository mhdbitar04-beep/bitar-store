<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttributeResource;
use App\Models\Attribute;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AttributeController extends Controller
{
    /**
     * Options available when building product variants in the admin.
     */
    public function index(): AnonymousResourceCollection
    {
        return AttributeResource::collection(Attribute::query()->with('values')->orderBy('name')->get());
    }
}
