<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('short_description', 500)->nullable();
            $table->text('description')->nullable();
            // Money is always stored as integer cents.
            $table->unsignedInteger('base_price');
            $table->unsignedInteger('compare_at_price')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false)->index();
            // Denormalised counters (kept in sync by services) for fast filtering/sorting.
            $table->decimal('rating_avg', 3, 2)->default(0)->index();
            $table->unsignedInteger('reviews_count')->default(0);
            $table->unsignedInteger('sold_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'is_active']);
            $table->index('base_price');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
