<?php

namespace App\Console\Commands;

use App\Support\DemoImages;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Throwable;

class DownloadDemoImages extends Command
{
    protected $signature = 'store:download-images {--force : Re-download photos that already exist}';

    protected $description = 'Download the demo product photos into public/images/products (run once, then re-seed)';

    public function handle(): int
    {
        File::ensureDirectoryExists(public_path(DemoImages::DIRECTORY));

        $downloaded = $skipped = 0;
        $failed = [];

        foreach (DemoImages::SOURCES as $slug => [, $count]) {
            for ($i = 1; $i <= $count; $i++) {
                $target = public_path(DemoImages::localPath($slug, $i));

                if (is_file($target) && ! $this->option('force')) {
                    $skipped++;

                    continue;
                }

                try {
                    $response = Http::timeout(30)->retry(2, 500)->get(DemoImages::remoteUrl($slug, $i));

                    if ($response->successful() && str_starts_with((string) $response->header('Content-Type'), 'image/')) {
                        File::put($target, $response->body());
                        $downloaded++;
                        $this->line("  <info>✓</info> {$slug}-{$i}.webp");

                        continue;
                    }

                    $failed[] = "{$slug}-{$i} (HTTP {$response->status()})";
                } catch (Throwable $e) {
                    $failed[] = "{$slug}-{$i} ({$e->getMessage()})";
                }

                $this->line("  <error>✗</error> {$slug}-{$i}.webp");
            }
        }

        $this->newLine();
        $this->info("Downloaded: {$downloaded}   Already present: {$skipped}   Failed: ".count($failed));

        if ($failed !== []) {
            $this->warn('Failed photos keep their generated placeholder:');
            foreach ($failed as $item) {
                $this->line("  - {$item}");
            }
        }

        $this->comment('Next: php artisan migrate:fresh --seed   (rebuilds the catalogue with these photos)');

        return self::SUCCESS;
    }
}
