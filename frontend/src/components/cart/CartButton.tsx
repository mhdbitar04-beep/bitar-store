import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { selectCartCount, useCartStore } from '@/stores/cartStore'

/** Header cart button. Its id is the landing target of the "fly to cart" animation. */
export function CartButton() {
  const count = useCartStore(selectCartCount)
  const open = useCartStore((s) => s.open)

  return (
    <button
      id="cart-button"
      onClick={open}
      className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-surface-2"
      aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
    >
      <ShoppingBag className="h-5 w-5" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="gold-gradient absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-on-gold"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
