<?php

namespace App\Providers;

use App\Services\Payments\FakePaymentGateway;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\StripePaymentGateway;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGateway::class, function () {
            return config('store.payment_gateway') === 'fake'
                ? new FakePaymentGateway
                : new StripePaymentGateway(
                    (string) config('services.stripe.secret'),
                    (string) config('services.stripe.webhook_secret'),
                    (int) config('services.stripe.webhook_tolerance'),
                );
        });
    }

    public function boot(): void
    {
        // Surface N+1 queries during development (logged, never breaks a request).
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
            logger()->warning('N+1 detected: lazy loading ['.$relation.'] on ['.$model::class.'].');
        });

        // The reset link must open the React app, not a Laravel view.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('store.frontend_url').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
        });

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));

        // Brute-force protection for login / register / password reset.
        RateLimiter::for('auth', fn (Request $request) => [
            Limit::perMinute(10)->by($request->ip()),
            Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
        ]);

        RateLimiter::for('checkout', fn (Request $request) => Limit::perMinute(10)->by($request->user()?->id ?: $request->ip()));
    }
}
