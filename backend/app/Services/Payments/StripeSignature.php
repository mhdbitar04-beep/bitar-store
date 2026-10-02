<?php

namespace App\Services\Payments;

use App\Exceptions\BusinessException;

/**
 * Minimal implementation of Stripe's "Stripe-Signature" scheme (t=...,v1=...),
 * shared by the fake gateway and the tests so webhooks are verified the same way.
 */
final class StripeSignature
{
    public static function sign(string $payload, string $secret, ?int $timestamp = null): string
    {
        $timestamp ??= time();

        return 't='.$timestamp.',v1='.hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
    }

    public static function verify(string $payload, ?string $header, string $secret, int $tolerance = 300): void
    {
        if (! $header || $secret === '') {
            throw self::invalid();
        }

        $parts = [];
        foreach (explode(',', $header) as $pair) {
            [$key, $value] = array_pad(explode('=', trim($pair), 2), 2, null);
            if ($key !== null && $value !== null) {
                $parts[$key][] = $value;
            }
        }

        $timestamp = (int) ($parts['t'][0] ?? 0);
        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        $valid = collect($parts['v1'] ?? [])->contains(fn ($sig) => hash_equals($expected, $sig));

        if (! $valid || abs(time() - $timestamp) > $tolerance) {
            throw self::invalid();
        }
    }

    private static function invalid(): BusinessException
    {
        return new BusinessException('Invalid webhook signature.', 'invalid_signature', 400);
    }
}
