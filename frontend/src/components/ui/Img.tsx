import { useState, type ImgHTMLAttributes } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Lazy image with a soft fade-in and a graceful fallback. */
export function Img({ className, src, alt = '', loading = 'lazy', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-surface-2 text-muted', className)} role="img" aria-label={alt}>
        <ImageOff className="h-6 w-6" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(
        // Product photos are cut-outs: give them a soft light backdrop so dark items stay visible.
        src.includes('/images/products/') ? 'photo-bg' : 'bg-surface-2',
        'transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
      {...props}
    />
  )
}
