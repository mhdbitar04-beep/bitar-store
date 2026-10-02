<?php

use App\Support\MediaUrl;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Order items keep an absolute snapshot of the image URL. Add the artwork version
 * so browsers fetch the new category illustrations instead of a cached old image.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('order_items')
            ->where('image_url', 'like', '%/placeholder/%')
            ->where('image_url', 'not like', '%?v=%')
            ->orderBy('id')->get()
            ->each(fn ($row) => DB::table('order_items')->where('id', $row->id)->update([
                'image_url' => $row->image_url.'?v='.MediaUrl::PLACEHOLDER_VERSION,
            ]));
    }

    public function down(): void
    {
        //
    }
};
