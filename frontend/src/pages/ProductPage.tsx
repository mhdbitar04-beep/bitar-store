import { motion } from 'framer-motion'
import { Check, ChevronRight, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ImageGallery } from '@/components/product/ImageGallery'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Reviews } from '@/components/product/Reviews'
import { VariantPicker } from '@/components/product/VariantPicker'
import { WishlistButton } from '@/components/product/WishlistButton'
import { Button } from '@/components/ui/Button'
import { Price } from '@/components/ui/Price'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stars } from '@/components/ui/Stars'
import { useAddToCart } from '@/features/cart/useAddToCart'
import { useProduct, useRelatedProducts } from '@/features/products/api'
import { fadeUp, stagger } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { Variant } from '@/types/api'
import NotFoundPage from './NotFoundPage'

export default function ProductPage() {
  const { slug } = useParams()
  const { data: product, isLoading, isError } = useProduct(slug)
  const { data: related } = useRelatedProducts(slug)
  const addToCart = useAddToCart()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [quantity, setQuantity] = useState(1)
  const [selected, setSelected] = useState<Record<number, number>>({})
  useDocumentTitle(product?.name)

  const variants = useMemo(() => product?.variants ?? [], [product])
  const hasOptions = (product?.options?.length ?? 0) > 0

  // Preselect the default (or first in-stock) variant's options.
  useEffect(() => {
    if (!product) return
    const initial = variants.find((v) => v.is_default && v.stock > 0) ?? variants.find((v) => v.stock > 0) ?? variants[0]
    const map: Record<number, number> = {}
    initial?.attribute_values?.forEach((av) => (map[av.attribute_id] = av.id))
    setSelected(map)
    setQuantity(1)
  }, [product, variants])

  const variant: Variant | undefined = useMemo(() => {
    if (!hasOptions) return variants[0]
    return variants.find((v) =>
      product!.options!.every((o) => v.attribute_values?.some((av) => av.id === selected[o.attribute.id])),
    )
  }, [variants, selected, hasOptions, product])

  if (isLoading) return <ProductSkeleton />
  if (isError || !product) return <NotFoundPage />

  const inStock = !!variant && variant.stock > 0
  const lowStock = inStock && variant!.stock <= 5
  const images = product.images?.length ? product.images : product.primary_image ? [product.primary_image] : []

  return (
    <div className="container-x py-8">
      <nav className="mb-6 flex items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-gold">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-gold">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-gold">{product.category.name}</Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-fg">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ImageGallery images={images} name={product.name} />

        <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp}>
            {product.category && <p className="eyebrow mb-3">{product.category.name}</p>}
            <h1 className="text-4xl leading-tight sm:text-5xl">{product.name}</h1>
            <a href="#reviews-title" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
              <Stars value={product.rating_avg} /> {product.rating_avg.toFixed(1)} · {product.reviews_count} reviews
            </a>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Price amount={variant?.price ?? product.price_min} compareAt={product.compare_at_price} size="lg" />
          </motion.div>

          {product.short_description && (
            <motion.p variants={fadeUp} className="text-muted">{product.short_description}</motion.p>
          )}

          {hasOptions && (
            <motion.div variants={fadeUp}>
              <VariantPicker
                options={product.options!}
                variants={variants}
                selected={selected}
                onChange={(attr, value) => {
                  setSelected((s) => ({ ...s, [attr]: value }))
                  setQuantity(1)
                }}
              />
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="text-sm" aria-live="polite">
            {!variant ? (
              <span className="text-muted">This combination is not available.</span>
            ) : inStock ? (
              <span className={lowStock ? 'font-medium text-amber-500' : 'flex items-center gap-1.5 text-success'}>
                {lowStock ? `Only ${variant.stock} left — order soon` : <><Check className="h-4 w-4" /> In stock</>}
              </span>
            ) : (
              <span className="font-medium text-danger">Out of stock</span>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <div className="flex h-13 items-center rounded-full border border-line">
              <button className="cursor-pointer px-4 py-3 hover:text-gold disabled:opacity-40" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">{quantity}</span>
              <button className="cursor-pointer px-4 py-3 hover:text-gold disabled:opacity-40" onClick={() => setQuantity((q) => Math.min(variant?.stock ?? 1, q + 1, 20))} disabled={!variant || quantity >= Math.min(variant.stock, 20)} aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button ref={buttonRef} size="lg" className="flex-1" disabled={!inStock} onClick={() => variant && addToCart(product, variant, quantity, buttonRef.current)}>
              {inStock ? 'Add to cart' : 'Sold out'}
            </Button>
            <WishlistButton productId={product.id} initial={product.is_wishlisted} className="h-13 w-13" />
          </motion.div>

          <motion.ul variants={fadeUp} className="grid gap-3 border-t border-line pt-6 text-sm text-muted sm:grid-cols-2">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Free shipping over $150</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> 2-year warranty</li>
          </motion.ul>

          {product.description && (
            <motion.div variants={fadeUp} className="border-t border-line pt-6">
              <h2 className="mb-3 font-sans text-base font-semibold">Details</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
              {variant && <p className="mt-4 text-xs text-muted">SKU: {variant.sku}</p>}
            </motion.div>
          )}
        </motion.div>
      </div>

      <Reviews slug={product.slug} />

      {related && related.length > 0 && (
        <section className="mt-24" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-8 text-3xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="container-x grid gap-10 py-14 lg:grid-cols-2 lg:gap-16" aria-busy="true">
      <Skeleton className="aspect-square" />
      <div className="space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-13 w-full rounded-full" />
      </div>
    </div>
  )
}
