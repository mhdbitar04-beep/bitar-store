<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Seeded images are local "placeholder/{seed}.svg" paths (or absolute URLs);
 * uploaded images are stored on the public disk.
 */
final class MediaUrl
{
    public const PLACEHOLDER_VERSION = 2;

    public static function from(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Generated demo artwork, served by PlaceholderImageController.
        if (str_starts_with($path, 'placeholder/')) {
            // The version busts browser caches when the artwork style changes.
            return url($path).'?v='.self::PLACEHOLDER_VERSION;
        }

        // Demo photos committed with the project (public/images/...).
        if (str_starts_with($path, 'images/')) {
            return url($path);
        }

        return Storage::disk('public')->url($path);
    }
}
