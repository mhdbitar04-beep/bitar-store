import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variantId: number
  productId: number
  slug: string
  name: string
  variantLabel: string | null
  image: string | null
  /** Unit price in cents at the time it was added (preview only — the server re-prices). */
  price: number
  quantity: number
  maxStock: number
}

interface CartState {
  items: CartItem[]
  couponCode: string | null
  isOpen: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (variantId: number, quantity: number) => void
  remove: (variantId: number) => void
  clear: () => void
  setCoupon: (code: string | null) => void
  open: () => void
  close: () => void
}

const MAX_PER_LINE = 20

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      isOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          const limit = Math.min(item.maxStock, MAX_PER_LINE)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, limit) } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: Math.min(quantity, limit) }] }
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxStock, MAX_PER_LINE)) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (variantId) => set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'bitar-cart',
      // The drawer's open state is UI-only and must not survive a reload.
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode }),
    },
  ),
)

export const selectCartCount = (s: CartState) => s.items.reduce((sum, i) => sum + i.quantity, 0)
export const selectCartSubtotal = (s: CartState) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
