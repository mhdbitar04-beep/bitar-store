import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { PaymentStep } from '@/components/checkout/PaymentStep'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { useCancelOrder, useOrder, usePayOrder } from '@/features/orders/api'
import { cn } from '@/lib/cn'
import { base } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError, OrderStatus } from '@/types/api'
import NotFoundPage from './NotFoundPage'

const FLOW: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const { number } = useParams()
  const { data: order, isLoading, isError } = useOrder(number)
  const cancel = useCancelOrder()
  const pay = usePayOrder()
  const [secret, setSecret] = useState<string | null>(null)
  useDocumentTitle(number ? `Order ${number}` : 'Order')

  if (isLoading) return <PageLoader />
  if (isError || !order) return <NotFoundPage />

  const step = FLOW.indexOf(order.status)
  const terminal = order.status === 'cancelled' || order.status === 'refunded'

  return (
    <div className="container-x max-w-5xl py-10">
      <Link to="/account/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl">Order {order.number}</h1>
          <p className="mt-1 text-sm text-muted">Placed {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress tracker */}
      {!terminal && (
        <ol className="card mb-8 grid grid-cols-5 gap-2 p-6" aria-label="Order progress">
          {FLOW.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-2 text-center">
              <motion.span
                initial={false}
                animate={{ scale: i === step ? 1.1 : 1 }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300',
                  i <= step ? 'gold-gradient border-transparent text-on-gold' : 'border-line text-muted',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </motion.span>
              <span className={cn('text-[11px] capitalize sm:text-xs', i <= step ? 'text-fg' : 'text-muted')}>{s}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="card p-6">
          <OrderSummary
            lines={(order.items ?? []).map((i) => ({ key: i.id, name: i.product_name, variant: i.variant_label, image: i.image_url, quantity: i.quantity, total: i.line_total }))}
            totals={{ subtotal: order.subtotal, discount: order.discount_total, shipping: order.shipping_total, tax: order.tax_total, total: order.total, currency: order.currency, couponCode: order.coupon_code }}
          />

          <AnimatePresence>
            {secret && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={base} className="mt-8 overflow-hidden border-t border-line pt-8">
                <PaymentStep order={order} clientSecret={secret} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="space-y-6">
          <div className="card p-6 text-sm">
            <h2 className="mb-3 font-sans text-base font-semibold">Shipping to</h2>
            <p>{order.shipping_address.full_name}</p>
            <p className="text-muted">{order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}</p>
            <p className="text-muted">{order.shipping_address.city} {order.shipping_address.postal_code}, {order.shipping_address.country_code}</p>
            <p className="text-muted">{order.shipping_address.phone}</p>
          </div>

          {order.history && order.history.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4 font-sans text-base font-semibold">Timeline</h2>
              <ol className="relative space-y-4 border-l border-line pl-5">
                {order.history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full bg-gold" />
                    <p className="text-sm font-medium capitalize">{h.to_status}</p>
                    {h.note && <p className="text-xs text-muted">{h.note}</p>}
                    <time className="text-xs text-muted">{new Date(h.created_at).toLocaleString()}</time>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {order.can_pay && !secret && (
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                loading={pay.isPending}
                onClick={() => pay.mutate(order.number, { onSuccess: (r) => setSecret(r.client_secret), onError: (e) => toast.error((e as unknown as ApiError).message) })}
              >
                Pay now
              </Button>
              <Button
                variant="danger"
                className="w-full"
                loading={cancel.isPending}
                onClick={() => cancel.mutate(order.number, { onSuccess: () => toast.success('Order cancelled'), onError: (e) => toast.error((e as unknown as ApiError).message) })}
              >
                Cancel order
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
