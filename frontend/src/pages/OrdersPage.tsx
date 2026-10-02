import { motion } from 'framer-motion'
import { ChevronRight, Package } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Img } from '@/components/ui/Img'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useOrders } from '@/features/orders/api'
import { fadeUp, stagger } from '@/lib/motion'
import { formatMoney } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function OrdersPage() {
  useDocumentTitle('My orders')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrders(page)

  return (
    <div className="container-x max-w-4xl py-10">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="mb-8 text-4xl">My orders</h1>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data?.data.length ? (
        <>
          <motion.ul variants={stagger(0.06)} initial="hidden" animate="show" key={page} className="space-y-4">
            {data.data.map((order) => (
              <motion.li key={order.id} variants={fadeUp}>
                <Link to={`/account/orders/${order.number}`} className="card group flex items-center gap-4 p-5 transition-colors duration-200 hover:border-gold/60">
                  <div className="flex -space-x-3">
                    {order.items?.slice(0, 3).map((item) => (
                      <Img key={item.id} src={item.image_url ?? undefined} alt="" className="h-14 w-14 rounded-xl border-2 border-surface object-cover" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{order.number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {order.items_count} item{order.items_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="font-semibold text-gold">{formatMoney(order.total, order.currency)}</span>
                  <ChevronRight className="h-4 w-4 text-muted transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </motion.li>
            ))}
          </motion.ul>
          <Pagination page={page} lastPage={data.meta.last_page} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="No orders yet"
          description="When you place an order it will show up here."
          action={<Link to="/products" className="gold-gradient inline-flex h-11 items-center rounded-full px-6 font-semibold text-on-gold">Start shopping</Link>}
        />
      )}
    </div>
  )
}
