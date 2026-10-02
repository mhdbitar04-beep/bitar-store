<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cancel unpaid orders older than 1 hour and release their reserved stock.
Schedule::command('orders:expire-pending')->everyFifteenMinutes();

Artisan::command('orders:expire-pending', function (App\Services\OrderService $orders) {
    $count = $orders->expireStalePendingOrders();
    $this->info("Expired {$count} unpaid order(s).");
})->purpose('Cancel unpaid orders past the payment window and release their stock');
