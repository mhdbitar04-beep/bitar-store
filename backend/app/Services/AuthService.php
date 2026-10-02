<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * @param  array{name: string, email: string, password: string}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = User::query()->create($data);

        return ['user' => $user, 'token' => $this->issueToken($user)];
    }

    /**
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password, string $device = 'web'): array
    {
        $user = User::query()->where('email', strtolower($email))->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            // Same message for "unknown email" and "wrong password" (no user enumeration).
            throw ValidationException::withMessages(['email' => ['These credentials do not match our records.']]);
        }

        return ['user' => $user, 'token' => $this->issueToken($user, $device)];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    public function sendResetLink(string $email): void
    {
        // Always "succeeds" from the client's point of view to avoid leaking which emails exist.
        Password::sendResetLink(['email' => strtolower($email)]);
    }

    /**
     * @param  array{email: string, token: string, password: string}  $data
     *
     * @throws ValidationException
     */
    public function resetPassword(array $data): void
    {
        $status = Password::reset(
            ['email' => strtolower($data['email']), 'token' => $data['token'], 'password' => $data['password']],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                // Log out every device after a password reset.
                $user->tokens()->delete();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }
    }

    public function changePassword(User $user, string $newPassword): void
    {
        $user->forceFill(['password' => $newPassword])->save();

        // Keep the current session, revoke the others.
        $current = $user->currentAccessToken();
        $user->tokens()->when($current, fn ($q) => $q->whereKeyNot($current->id))->delete();
    }

    private function issueToken(User $user, string $device = 'web'): string
    {
        return $user->createToken($device, ['*'], now()->addDays(30))->plainTextToken;
    }
}
