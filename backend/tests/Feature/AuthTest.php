<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

it('registers a customer and returns a token', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Mohammad',
        'email' => 'MOHAMMAD@Example.com',
        'password' => 'Secret123',
        'password_confirmation' => 'Secret123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'role'], 'token']])
        ->assertJsonPath('data.user.email', 'mohammad@example.com')
        ->assertJsonPath('data.user.role', 'customer');

    expect(User::query()->where('email', 'mohammad@example.com')->exists())->toBeTrue();
});

it('returns the unified error shape on validation failure', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/v1/auth/register', [
        'name' => 'X',
        'email' => 'taken@example.com',
        'password' => 'short',
        'password_confirmation' => 'nope',
    ])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'validation_error')
        ->assertJsonStructure(['message', 'code', 'errors' => ['name', 'email', 'password']]);
});

it('cannot self-assign the admin role on register', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Hacker',
        'email' => 'hacker@example.com',
        'password' => 'Secret123',
        'password_confirmation' => 'Secret123',
        'role' => 'admin',
    ])->assertCreated()->assertJsonPath('data.user.role', 'customer');
});

it('logs in with valid credentials', function () {
    User::factory()->create(['email' => 'jane@example.com']);

    $this->postJson('/api/v1/auth/login', ['email' => 'jane@example.com', 'password' => 'Password123'])
        ->assertOk()
        ->assertJsonStructure(['data' => ['token', 'user']]);
});

it('rejects invalid credentials without revealing which field is wrong', function () {
    User::factory()->create(['email' => 'jane@example.com']);

    $this->postJson('/api/v1/auth/login', ['email' => 'jane@example.com', 'password' => 'wrong-password'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
});

it('returns 401 json for guests on protected routes', function () {
    $this->getJson('/api/v1/auth/me')
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.', 'code' => 'unauthenticated']);
});

it('returns the current user', function () {
    $user = actingAsCustomer();

    $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $user->id);
});

it('revokes the token on logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('web')->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();

    expect($user->tokens()->count())->toBe(0);
});

it('sends a password reset link', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class);
});

it('does not reveal whether an email exists', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();
});

it('resets the password with a valid token', function () {
    $user = User::factory()->create();
    $token = Password::createToken($user);

    $this->postJson('/api/v1/auth/reset-password', [
        'email' => $user->email,
        'token' => $token,
        'password' => 'NewSecret123',
        'password_confirmation' => 'NewSecret123',
    ])->assertOk();

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'NewSecret123'])->assertOk();
});

it('updates the profile', function () {
    actingAsCustomer();

    $this->putJson('/api/v1/account/profile', ['name' => 'New Name'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name');
});
