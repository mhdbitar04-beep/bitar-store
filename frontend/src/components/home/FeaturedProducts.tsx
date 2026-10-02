import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { useProducts } from '@/features/products/api'

export function FeaturedProducts() {
  const { data, isLoading } = useProducts({ featured: true, per_page: 8, sort: 'rating' })

  return (
    <section className="container-x py-12" aria-labelledby="featured-title">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Hand-picked</p>
          <h2 id="featured-title" className="text-4xl sm:text-5xl">Featured pieces</h2>
        </div>
        <Link to="/products" className="group hidden items-center gap-2 text-sm font-semibold text-gold sm:flex">
          View all <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
      {isLoading ? <ProductGridSkeleton count={8} /> : <ProductGrid products={data?.data ?? []} />}
    </section>
  )
}
