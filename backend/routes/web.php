<?php

use App\Http\Controllers\PlaceholderImageController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'api' => url('/api/v1'),
    'status' => 'ok',
]));

// Locally generated demo artwork (see PlaceholderImageController).
Route::get('placeholder/{seed}.svg', PlaceholderImageController::class)
    ->where('seed', '[A-Za-z0-9_-]+')
    ->name('placeholder');
