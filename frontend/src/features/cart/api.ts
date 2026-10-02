import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCartStore } from '@/stores/cartStore'
import type { CartQuote } from '@/types/api'

/** Server-side pricing of the local cart (live prices, stock, coupon). */
export function useCartQuote(enabled = true) {
  const items = useCartStore((s) => s.items)
  const couponCode = useCartStore((s) => s.couponCode)
  const payload = {
    items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    coupon_code: couponCode || undefined,
  }

  return useQuery({
    queryKey: ['cart-quote', payload],
    enabled: enabled && items.length > 0,
    queryFn: async () => (await api.post<{ data: CartQuote }>('/cart/quote', payload)).data.data,
    staleTime: 0,
    retry: false,
  })
}
