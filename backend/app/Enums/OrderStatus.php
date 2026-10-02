<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    /**
     * The state machine: which statuses can follow the current one.
     *
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Paid, self::Cancelled],
            self::Paid => [self::Processing, self::Cancelled, self::Refunded],
            self::Processing => [self::Shipped, self::Cancelled, self::Refunded],
            self::Shipped => [self::Delivered, self::Refunded],
            self::Delivered => [self::Refunded],
            self::Cancelled, self::Refunded => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }

    /**
     * Statuses that count as revenue in reports.
     *
     * @return list<self>
     */
    public static function revenue(): array
    {
        return [self::Paid, self::Processing, self::Shipped, self::Delivered];
    }

    /**
     * Statuses where stock has been given back / never consumed.
     */
    public function releasesStock(): bool
    {
        return in_array($this, [self::Cancelled, self::Refunded], true);
    }

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
