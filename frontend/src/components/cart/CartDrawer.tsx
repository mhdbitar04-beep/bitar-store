import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Img } from '@/components/ui/Img'
import { base, fast } from '@/lib/motion'
import { formatMoney } from '@/lib/money'
import { selectCartSubtotal, useCartStore } from '@/stores/cartStore'

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove } = useCartStore()
  const subtotal = useCartStore(selectCartSubtotal)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fast}
            onClick={close}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-line bg-bg shadow-card"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={base}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-2xl">Your Cart</h2>
              <button onClick={close} className="cursor-pointer rounded-full p-2 hover:bg-surface-2" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <p className="text-muted">Your cart is empty.</p>
                <Button
                  onClick={() => {
                    close()
                    navigate('/products')
                  }}
                >
                  Start shopping
                </Button>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.variantId}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24, height: 0, marginTop: 0 }}
                        transition={base}
                        className="flex gap-4"
                      >
                        <Link to={`/products/${item.slug}`} onClick={close} className="shrink-0">
                          <Img src={item.image ?? undefined} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{item.name}</p>
                              {item.variantLabel && <p className="text-xs text-muted">{item.variantLabel}</p>}
                            </div>
                            <button onClick={() => remove(item.variantId)} className="cursor-pointer p-1 text-muted hover:text-danger" aria-label={`Remove ${item.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-line">
                              <button
                                className="cursor-pointer p-2 hover:text-gold"
                                onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                              <button
                                className="cursor-pointer p-2 hover:text-gold disabled:opacity-40"
                                onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                                disabled={item.quantity >= item.maxStock}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-semibold text-gold">{formatMoney(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="space-y-4 border-t border-line px-6 py-5">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-muted">Subtotal</span>
                    <motion.span key={subtotal} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={fast} className="font-semibold">
                      {formatMoney(subtotal)}
                    </motion.span>
                  </div>
                  <p className="text-xs text-muted">Shipping, taxes and discounts are calculated at checkout.</p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      close()
                      navigate('/checkout')
                    }}
                  >
                    Checkout
                  </Button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
