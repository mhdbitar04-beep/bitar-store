import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Img } from '@/components/ui/Img'
import { Price } from '@/components/ui/Price'
import { Stars } from '@/components/ui/Stars'
import { fadeUp } from '@/lib/motion'
import type { Product } from '@/types/api'
import { WishlistButton } from './WishlistButton'

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price_min
  const soldOut = product.in_stock === false

  return (
    <motion.article variants={fadeUp} layout="position" className="group relative">
      <Link to={`/products/${product.slug}`} className="block">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25 }}
          className="card relative overflow-hidden transition-[border-color,box-shadow] duration-300 group-hover:border-gold/60 group-hover:shadow-card"
        >
          <div className="relative aspect-square overflow-hidden">
            <Img
              src={product.primary_image?.url}
              alt={product.primary_image?.alt ?? product.name}
              width={600}
              height={600}
              loading={priority ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-400 ease-(--ease-lux) group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {onSale && <span className="gold-gradient rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-on-gold uppercase">Sale</span>}
              {soldOut && <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase">Sold out</span>}
            </div>
          </div>
          <div className="space-y-1.5 p-4">
            {product.category && <p className="text-[11px] tracking-[0.2em] text-muted uppercase">{product.category.name}</p>}
            <h3 className="truncate font-sans text-base font-medium">{product.name}</h3>
            <div className="flex items-center gap-2">
              <Stars value={product.rating_avg} size={12} />
              <span className="text-xs text-muted">({product.reviews_count})</span>
            </div>
            <Price amount={product.price_min} compareAt={product.compare_at_price} from={product.price_max > product.price_min} />
          </div>
        </motion.div>
      </Link>
      <WishlistButton productId={product.id} initial={product.is_wishlisted} className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" />
    </motion.article>
  )
}
