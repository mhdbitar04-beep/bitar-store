<?php

use App\Enums\OrderStatus;

it('allows only valid transitions', function (OrderStatus $from, OrderStatus $to, bool $allowed) {
    expect($from->canTransitionTo($to))->toBe($allowed);
})->with([
    [OrderStatus::Pending, OrderStatus::Paid, true],
    [OrderStatus::Pending, OrderStatus::Shipped, false],
    [OrderStatus::Paid, OrderStatus::Processing, true],
    [OrderStatus::Shipped, OrderStatus::Delivered, true],
    [OrderStatus::Delivered, OrderStatus::Pending, false],
    [OrderStatus::Cancelled, OrderStatus::Paid, false],
]);
