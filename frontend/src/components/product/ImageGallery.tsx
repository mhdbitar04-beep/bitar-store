import { AnimatePresence, motion } from 'framer-motion'
import { useState, type MouseEvent } from 'react'
import { Img } from '@/components/ui/Img'
import { cn } from '@/lib/cn'
import { base } from '@/lib/motion'
import type { ProductImage } from '@/types/api'

/** Main image with hover-to-zoom (follows the cursor) and a thumbnail strip. */
export function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const current = images[index]

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 })
  }

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200',
                i === index ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <Img src={img.url} alt="" width={80} height={80} className="h-18 w-18 object-cover md:h-20 md:w-20" />
            </button>
          ))}
        </div>
      )}

      <div
        className="card relative aspect-square flex-1 cursor-zoom-in overflow-hidden"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current?.id ?? 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={base} className="h-full w-full">
            <Img
              src={current?.url}
              alt={current?.alt ?? name}
              width={900}
              height={900}
              loading="eager"
              fetchPriority="high"
              className="h-full w-full object-cover transition-transform duration-200"
              style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
