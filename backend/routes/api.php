<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\StripeWebhookController;
use App\Http\Controllers\Api\V1\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public
    |--------------------------------------------------------------------------
    */
    Route::get('config', ConfigController::class)->name('config');

    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
    Route::get('products/{product:slug}/related', [ProductController::class, 'related'])->name('products.related');
    Route::get('products/{product:slug}/reviews', [ReviewController::class, 'index'])->name('products.reviews.index');

    Route::post('cart/quote', [CartController::class, 'quote'])->name('cart.quote');

    Route::post('webhooks/stripe', StripeWebhookController::class)->name('webhooks.stripe');

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::middleware('throttle:auth')->group(function () {
            Route::post('register', [AuthController::class, 'register'])->name('register');
            Route::post('login', [AuthController::class, 'login'])->name('login');
            Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email');
            Route::post('reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me'])->name('me');
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Customer (authenticated)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {
        Route::put('account/profile', [AccountController::class, 'updateProfile'])->name('account.profile');
        Route::put('account/password', [AccountController::class, 'changePassword'])->name('account.password');
        Route::apiResource('account/addresses', AddressController::class)
            ->except('show')
            ->parameters(['addresses' => 'address'])
            ->names('account.addresses');

        Route::post('products/{product:slug}/reviews', [ReviewController::class, 'store'])->name('products.reviews.store');
        Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy');

        Route::get('wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
        Route::post('wishlist/{product}', [WishlistController::class, 'store'])->name('wishlist.store');
        Route::delete('wishlist/{product}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');

        Route::post('checkout', CheckoutController::class)->middleware('throttle:checkout')->name('checkout');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order:number}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('orders/{order:number}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('orders/{order:number}/pay', [OrderController::class, 'pay'])->name('orders.pay');
        Route::post('orders/{order:number}/simulate-payment', [OrderController::class, 'simulatePayment'])->name('orders.simulate');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('dashboard', Admin\DashboardController::class)->name('dashboard');
        Route::get('attributes', [Admin\AttributeController::class, 'index'])->name('attributes.index');

        Route::apiResource('products', Admin\ProductController::class);
        Route::post('products/{product}/images', [Admin\ProductImageController::class, 'store'])->name('products.images.store');
        Route::patch('product-images/{image}/primary', [Admin\ProductImageController::class, 'makePrimary'])->name('product-images.primary');
        Route::delete('product-images/{image}', [Admin\ProductImageController::class, 'destroy'])->name('product-images.destroy');

        Route::apiResource('categories', Admin\CategoryController::class)->except('show');
        Route::apiResource('coupons', Admin\CouponController::class);

        Route::get('orders', [Admin\OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [Admin\OrderController::class, 'show'])->name('orders.show');
        Route::patch('orders/{order}/status', [Admin\OrderController::class, 'updateStatus'])->name('orders.status');
    });
});
