<?php

use App\Models\Product;
use App\Models\User;
use App\Services\Payments\StripeSignature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(Tests\TestCase::class)->in('Unit');

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function actingAsCustomer(?User $user = null): User
{
    $user ??= User::factory()->create();
    Sanctum::actingAs($user);

    return $user;
}

function actingAsAdmin(): User
{
    $admin = User::factory()->admin()->create();
    Sanctum::actingAs($admin);

    return $admin;
}

/**
 * Active product with a single default variant.
 */
function productWithStock(int $stock = 10, int $price = 5000, array $attributes = []): Product
{
    return Product::factory()
        ->withStock($stock)
        ->create(['base_price' => $price, 'compare_at_price' => null] + $attributes)
        ->load('variants');
}

function shippingAddress(): array
{
    return [
        'full_name' => 'Jane Doe',
        'phone' => '+15555550100',
        'line1' => '1 Gold Street',
        'city' => 'New York',
        'postal_code' => '10001',
        'country_code' => 'US',
    ];
}

/**
 * Builds a Stripe-style signed webhook request body + header.
 *
 * @return array{0: string, 1: string}
 */
function stripeWebhook(string $type, array $object, ?string $eventId = null): array
{
    $payload = json_encode([
        'id' => $eventId ?? 'evt_'.uniqid(),
        'type' => $type,
        'data' => ['object' => $object],
    ]);

    return [$payload, StripeSignature::sign($payload, (string) config('services.stripe.webhook_secret'))];
}
