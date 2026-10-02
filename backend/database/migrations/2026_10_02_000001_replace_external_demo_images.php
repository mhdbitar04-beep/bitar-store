<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Demo images used to point at picsum.photos. They are now generated locally
 * (placeholder/{seed}.svg), so the store works offline. Existing data is converted
 * in place — nothing is deleted.
 */
return new class extends Migration
{
    private const PATTERN = '#^https://picsum\.photos/seed/([A-Za-z0-9_-]+)/.*$#';

    public function up(): void
    {
        foreach (['product_images' => 'path', 'categories' => 'image_path'] as $table => $column) {
            DB::table($table)->where($column, 'like', 'https://picsum.photos/%')->orderBy('id')->get()
                ->each(function ($row) use ($table, $column) {
                    DB::table($table)->where('id', $row->id)->update([
                        $column => preg_replace(self::PATTERN, 'placeholder/$1.svg', $row->{$column}),
                    ]);
                });
        }

        // Order items store an absolute snapshot URL.
        DB::table('order_items')->where('image_url', 'like', 'https://picsum.photos/%')->orderBy('id')->get()
            ->each(function ($row) {
                DB::table('order_items')->where('id', $row->id)->update([
                    'image_url' => url(preg_replace(self::PATTERN, 'placeholder/$1.svg', $row->image_url)),
                ]);
            });
    }

    public function down(): void
    {
        // Irreversible data fix.
    }
};
