<?php

namespace App\Support;

/**
 * Draws black & gold product illustrations as SVG — one silhouette per category —
 * so the demo catalogue has meaningful images without any external host or files.
 * Pure PHP (no framework calls): the same input always produces the same image.
 */
final class PlaceholderArt
{
    /** Category slug => illustration. Parent categories reuse a child's drawing. */
    private const TYPES = [
        'smartphones' => 'phone',
        'laptops' => 'laptop',
        'audio' => 'headphones',
        'shoes' => 'shoe',
        'bags' => 'bag',
        'watches' => 'watch',
        'fragrances' => 'perfume',
        'skincare' => 'serum',
        'decor' => 'vase',
        'kitchen' => 'pot',
        'electronics' => 'phone',
        'fashion' => 'watch',
        'beauty' => 'perfume',
        'home-living' => 'vase',
    ];

    public static function typeFor(?string $categorySlug): string
    {
        return self::TYPES[$categorySlug ?? ''] ?? 'abstract';
    }

    /**
     * @param  int  $variant  1 = front, 2 = tilted, 3 = close-up
     */
    public static function svg(string $type, string $seed, int $variant = 1): string
    {
        $h = crc32($seed);
        $glowX = 30 + $h % 40;
        $glowY = 25 + ($h >> 3) % 30;
        $ring = 300 + ($h >> 6) % 50;

        [$rotate, $scale] = match ($variant) {
            2 => [-14, 1.0],
            3 => [8, 1.45],
            default => [0, 1.0],
        };

        $shape = self::shape($type, $h);

        return <<<SVG
        <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 800 800">
          <defs>
            <radialGradient id="glow" cx="{$glowX}%" cy="{$glowY}%" r="75%">
              <stop offset="0" stop-color="#3a2f12"/>
              <stop offset=".55" stop-color="#16130d"/>
              <stop offset="1" stop-color="#0a0a0a"/>
            </radialGradient>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f6e3a1"/>
              <stop offset=".45" stop-color="#d4af37"/>
              <stop offset="1" stop-color="#8a6b14"/>
            </linearGradient>
            <linearGradient id="dark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#2a261d"/>
              <stop offset="1" stop-color="#0d0c0a"/>
            </linearGradient>
          </defs>
          <rect width="800" height="800" fill="url(#glow)"/>
          <circle cx="400" cy="400" r="{$ring}" fill="none" stroke="#d4af37" stroke-width="1" stroke-dasharray="2 9" opacity=".35"/>
          <ellipse cx="400" cy="640" rx="210" ry="22" fill="#000" opacity=".45"/>
          <g transform="translate(400 400) rotate({$rotate}) scale({$scale})" stroke-linejoin="round" stroke-linecap="round">
            {$shape}
          </g>
        </svg>
        SVG;
    }

    private static function shape(string $type, int $h): string
    {
        $g = 'fill="url(#gold)"';
        $d = 'fill="url(#dark)"';
        $line = 'fill="none" stroke="#0d0c0a" stroke-width="6"';
        $goldLine = 'fill="none" stroke="url(#gold)"';

        return match ($type) {
            'phone' => <<<SVG
                <rect x="-98" y="-190" width="196" height="380" rx="34" {$g}/>
                <rect x="-84" y="-174" width="168" height="348" rx="22" {$d}/>
                <rect x="-28" y="-164" width="56" height="14" rx="7" fill="#0a0a0a"/>
                <circle cx="-46" cy="-110" r="20" {$g} opacity=".9"/><circle cx="-46" cy="-110" r="9" fill="#0a0a0a"/>
                <circle cx="-46" cy="-60" r="20" {$g} opacity=".9"/><circle cx="-46" cy="-60" r="9" fill="#0a0a0a"/>
                <rect x="-34" y="150" width="68" height="6" rx="3" {$g} opacity=".7"/>
                SVG,
            'laptop' => <<<SVG
                <rect x="-180" y="-140" width="360" height="232" rx="16" {$g}/>
                <rect x="-164" y="-124" width="328" height="200" rx="8" {$d}/>
                <path d="M-60 -40 L0 -90 L60 -40 L0 10 Z" {$goldLine} stroke-width="5" opacity=".7"/>
                <path d="M-226 96 H226 L204 128 H-204 Z" {$g}/>
                <rect x="-44" y="96" width="88" height="10" rx="5" fill="#0d0c0a" opacity=".6"/>
                SVG,
            'headphones' => <<<SVG
                <path d="M-136 40 A136 150 0 0 1 136 40" {$goldLine} stroke-width="26"/>
                <path d="M-136 40 A136 150 0 0 1 136 40" fill="none" stroke="#0d0c0a" stroke-width="6" opacity=".35"/>
                <rect x="-176" y="14" width="76" height="150" rx="34" {$g}/>
                <rect x="100" y="14" width="76" height="150" rx="34" {$g}/>
                <rect x="-158" y="40" width="40" height="98" rx="20" {$d}/>
                <rect x="118" y="40" width="40" height="98" rx="20" {$d}/>
                SVG,
            'shoe' => <<<SVG
                <path d="M-200 70 C-204 10 -168 -30 -118 -34 L-70 -100 C-50 -124 -14 -116 -2 -92 L44 -24 C100 -4 184 6 200 60 L200 86 H-200 Z" {$g}/>
                <path d="M-70 -100 C-40 -60 0 -30 44 -24" {$line}/>
                <path d="M-48 -66 L-18 -84 M-24 -46 L8 -64 M2 -30 L32 -46" {$line}/>
                <path d="M-200 30 C-150 20 -130 -6 -118 -34" {$line} opacity=".7"/>
                <rect x="-206" y="86" width="412" height="34" rx="17" {$d} stroke="url(#gold)" stroke-width="5"/>
                SVG,
            'bag' => <<<SVG
                <path d="M-84 -60 C-84 -196 84 -196 84 -60" {$goldLine} stroke-width="16"/>
                <path d="M-160 -64 H160 L186 176 Q188 196 168 196 H-168 Q-188 196 -186 176 Z" {$g}/>
                <path d="M-160 -20 H160" {$line} opacity=".55"/>
                <rect x="-30" y="-36" width="60" height="44" rx="10" {$d} stroke="url(#gold)" stroke-width="5"/>
                <circle cx="-84" cy="-60" r="11" fill="#0d0c0a"/><circle cx="84" cy="-60" r="11" fill="#0d0c0a"/>
                SVG,
            'watch' => <<<SVG
                <rect x="-62" y="-220" width="124" height="440" rx="30" {$d} stroke="url(#gold)" stroke-width="5"/>
                <path d="M-62 -150 H62 M-62 -120 H62 M-62 120 H62 M-62 150 H62" {$goldLine} stroke-width="3" opacity=".5"/>
                <rect x="112" y="-16" width="24" height="32" rx="6" {$g}/>
                <circle r="122" {$g}/>
                <circle r="98" {$d}/>
                <path d="M0 -84 V-70 M0 84 V70 M-84 0 H-70 M84 0 H70" {$goldLine} stroke-width="6"/>
                <path d="M0 0 L0 -58 M0 0 L40 22" {$goldLine} stroke-width="8"/>
                <circle r="9" {$g}/>
                SVG,
            'perfume' => <<<SVG
                <rect x="-52" y="-200" width="104" height="78" rx="12" {$g}/>
                <rect x="-30" y="-124" width="60" height="40" {$d} stroke="url(#gold)" stroke-width="5"/>
                <rect x="-112" y="-86" width="224" height="270" rx="30" {$g}/>
                <rect x="-92" y="-66" width="184" height="230" rx="18" {$d} opacity=".85"/>
                <rect x="-58" y="6" width="116" height="80" rx="6" {$goldLine} stroke-width="4"/>
                <path d="M-34 36 H34 M-22 56 H22" {$goldLine} stroke-width="4" opacity=".8"/>
                SVG,
            'serum' => <<<SVG
                <ellipse cx="0" cy="-196" rx="28" ry="36" {$d} stroke="url(#gold)" stroke-width="5"/>
                <rect x="-40" y="-166" width="80" height="74" rx="14" {$g}/>
                <rect x="-30" y="-92" width="60" height="34" {$d} stroke="url(#gold)" stroke-width="5"/>
                <path d="M-30 -58 C-80 -40 -84 -10 -84 20 V160 Q-84 190 -54 190 H54 Q84 190 84 160 V20 C84 -10 80 -40 30 -58 Z" {$g}/>
                <rect x="-56" y="36" width="112" height="96" rx="8" {$d} opacity=".85"/>
                <circle cx="0" cy="84" r="24" {$goldLine} stroke-width="4"/>
                SVG,
            'vase' => <<<SVG
                <path d="M0 -150 C-10 -230 -70 -250 -96 -214 M0 -150 C6 -240 70 -262 104 -226 M0 -150 V-270" {$goldLine} stroke-width="5" opacity=".8"/>
                <circle cx="-100" cy="-212" r="13" {$g}/><circle cx="108" cy="-224" r="13" {$g}/><circle cx="0" cy="-276" r="13" {$g}/>
                <path d="M-48 -150 H48 C40 -96 124 -50 124 44 C124 146 62 196 0 196 C-62 196 -124 146 -124 44 C-124 -50 -40 -96 -48 -150 Z" {$g}/>
                <path d="M-116 10 C-60 34 60 34 116 10 M-122 70 C-60 96 60 96 122 70" {$line} opacity=".5"/>
                <rect x="-56" y="-162" width="112" height="18" rx="9" {$d} stroke="url(#gold)" stroke-width="4"/>
                SVG,
            'pot' => <<<SVG
                <circle cx="0" cy="-128" r="20" {$g}/>
                <path d="M-166 -52 Q0 -150 166 -52 Z" {$g}/>
                <rect x="-176" y="-52" width="352" height="22" rx="11" {$d} stroke="url(#gold)" stroke-width="4"/>
                <rect x="-214" y="0" width="60" height="30" rx="15" {$g}/><rect x="154" y="0" width="60" height="30" rx="15" {$g}/>
                <rect x="-160" y="-28" width="320" height="200" rx="30" {$g}/>
                <path d="M-160 40 H160" {$line} opacity=".45"/>
                SVG,
            default => self::abstract($h),
        };
    }

    private static function abstract(int $h): string
    {
        $r = 150 + $h % 60;
        $angle = $h % 360;

        return <<<SVG
            <circle r="{$r}" fill="url(#gold)" opacity=".9"/>
            <rect x="-120" y="-120" width="240" height="240" rx="40" transform="rotate({$angle})" fill="none" stroke="#f6e3a1" stroke-width="4" opacity=".7"/>
            SVG;
    }
}
