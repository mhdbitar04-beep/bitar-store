import { toast } from 'sonner'
import { useCartStore } from '@/stores/cartStore'
import { useUiStore } from '@/stores/uiStore'
import type { Product, Variant } from '@/types/api'

export function useAddToCart() {
  const add = useCartStore((s) => s.add)
  const flyToCart = useUiStore((s) => s.flyToCart)

  return (product: Product, variant: Variant, quantity: number, sourceEl?: HTMLElement | null) => {
    const image = product.primary_image?.url ?? product.images?.[0]?.url ?? null

    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant.label ?? null,
        image,
        price: variant.price,
        maxStock: variant.stock,
      },
      quantity,
    )

    if (image && sourceEl) flyToCart(image, sourceEl.getBoundingClientRect())

    toast.success(`${product.name} added to cart`, {
      description: variant.label ?? undefined,
      action: { label: 'View cart', onClick: () => useCartStore.getState().open() },
    })
  }
}
