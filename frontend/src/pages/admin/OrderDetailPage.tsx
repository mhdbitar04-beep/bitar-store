import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { PageLoader } from '@/components/ui/Spinner'
import { useAdminOrder, useUpdateOrderStatus } from '@/features/admin/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError, OrderStatus } from '@/types/api'

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { data: order, isLoading } = useAdminOrder(orderId)
  const update = useUpdateOrderStatus(orderId)
  const [next, setNext] = useState<OrderStatus | ''>('')
  const [note, setNote] = useState('')
  useDocumentTitle(order ? `${order.number} · Admin` : 'Order · Admin')

  if (isLoading || !order) return <PageLoader />

  return (
    <div>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Orders
      </Link>
      <PageHeader title={order.number} subtitle={`Placed ${new Date(order.created_at).toLocaleString()}`} actions={<StatusBadge status={order.status} />} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card p-6">
          <OrderSummary
            lines={(order.items ?? []).map((i) => ({ key: i.id, name: i.product_name, variant: [i.variant_label, i.sku].filter(Boolean).join(' · '), image: i.image_url, quantity: i.quantity, total: i.line_total }))}
            totals={{ subtotal: order.subtotal, discount: order.discount_total, shipping: order.shipping_total, tax: order.tax_total, total: order.total, currency: order.currency, couponCode: order.coupon_code }}
          />
          {order.notes && <p className="mt-6 rounded-xl bg-surface-2 p-4 text-sm"><span className="text-muted">Customer note:</span> {order.notes}</p>}
        </section>

        <aside className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="font-sans text-base font-semibold">Update status</h2>
            {order.allowed_transitions.length === 0 ? (
              <p className="text-sm text-muted">This order is final — no further transitions.</p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!next) return
                  if (next === 'refunded' && !window.confirm('Refund this order through Stripe?')) return
                  update.mutate(
                    { status: next, note: note || undefined },
                    {
                      onSuccess: (o) => {
                        toast.success(`Order marked as ${o.status}`)
                        setNext('')
                        setNote('')
                      },
                      onError: (e) => toast.error((e as unknown as ApiError).message),
                    },
                  )
                }}
              >
                <Select value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} aria-label="New status">
                  <option value="">Choose next status…</option>
                  {order.allowed_transitions.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </Select>
                <Input placeholder="Internal note (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
                <Button type="submit" className="w-full" disabled={!next} loading={update.isPending}>Apply</Button>
              </form>
            )}
          </section>

          <section className="card p-6 text-sm">
            <h2 className="mb-3 font-sans text-base font-semibold">Customer</h2>
            <p className="font-medium">{order.customer?.name}</p>
            <p className="text-muted">{order.customer?.email}</p>
            <h3 className="mt-4 mb-1 font-medium">Ship to</h3>
            <p className="text-muted">
              {order.shipping_address.full_name}<br />
              {order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}<br />
              {order.shipping_address.city} {order.shipping_address.postal_code}, {order.shipping_address.country_code}<br />
              {order.shipping_address.phone}
            </p>
            {order.payment && <p className="mt-4 text-muted">Payment: <span className="text-fg capitalize">{order.payment.provider} · {order.payment.status}</span></p>}
          </section>

          {order.history && (
            <section className="card p-6">
              <h2 className="mb-4 font-sans text-base font-semibold">History</h2>
              <ol className="relative space-y-4 border-l border-line pl-5">
                {order.history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full bg-gold" />
                    <p className="text-sm font-medium capitalize">{h.from_status ? `${h.from_status} → ` : ''}{h.to_status}</p>
                    {h.note && <p className="text-xs text-muted">{h.note}</p>}
                    <time className="text-xs text-muted">{new Date(h.created_at).toLocaleString()}</time>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
