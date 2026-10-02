import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { useWishlist } from '@/features/wishlist/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function WishlistPage() {
  const { data, isLoading } = useWishlist()
  useDocumentTitle('Wishlist')

  return (
    <div className="container-x py-10">
      <p className="eyebrow mb-2">Saved for later</p>
      <h1 className="mb-8 text-4xl sm:text-5xl">Your wishlist</h1>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : data?.length ? (
        <ProductGrid products={data} />
      ) : (
        <EmptyState
          icon={<Heart className="h-7 w-7" />}
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here."
          action={<Link to="/products" className="gold-gradient inline-flex h-11 items-center rounded-full px-6 font-semibold text-on-gold">Discover products</Link>}
        />
      )}
    </div>
  )
}
