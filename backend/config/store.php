<?php

return [

    /*
    | All money in the application is stored and computed as integer cents.
    */
    'currency' => env('STORE_CURRENCY', 'usd'),

    'shipping' => [
        'flat' => (int) env('STORE_SHIPPING_FLAT', 799),
        'free_over' => (int) env('STORE_FREE_SHIPPING_OVER', 15000),
    ],

    'tax_rate' => (float) env('STORE_TAX_RATE', 0),

    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/'),

    /*
    | "stripe" talks to Stripe (test mode). "fake" never leaves the server and is
    | used by the test-suite and for offline demos.
    */
    'payment_gateway' => env('PAYMENT_GATEWAY', 'stripe'),

    /*
    | Unpaid orders keep their stock reserved for this many minutes.
    */
    'pending_order_ttl' => (int) env('STORE_PENDING_ORDER_TTL', 60),

    'pagination' => [
        'default' => 12,
        'max' => 48,
    ],
];
