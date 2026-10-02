import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/Skeleton'
import { stagger } from '@/lib/motion'
import type { Product } from '@/types/api'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products, gridKey }: { products: Product[]; gridKey?: string }) {
  return (
    <motion.div
      key={gridKey}
      variants={stagger(0.05)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </motion.div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
