<?php

namespace App\Policies;

use App\Models\Coupon;
use App\Models\User;

/**
 * Catalogue management is admin-only. Public reads don't go through this policy.
 */
class CouponPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Coupon $model): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Coupon $model): bool
    {
        return $user->isAdmin();
    }
}
