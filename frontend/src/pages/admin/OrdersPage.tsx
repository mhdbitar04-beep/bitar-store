import { Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader, Table, td, th } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminOrders } from '@/features/admin/api'
import { useDebounced } from '@/lib/useDebounced'
import { formatMoney } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useState } from 'react'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function AdminOrdersPage() {
  useDocumentTitle('Orders · Admin')
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const page = Number(params.get('page') ?? 1)
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const { data, isLoading } = useAdminOrders({ page, status: status || undefined, search: debounced || undefined })

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next)
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={data ? `${data.meta.total} orders` : undefined}
        actions={
          <>
            <label className="relative">
              <span className="sr-only">Search orders</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); set({ page: '' }) }} placeholder="Number, name or email…" className="field h-10 w-60 rounded-full pl-9" />
            </label>
            <select value={status} onChange={(e) => set({ status: e.target.value, page: '' })} className="field h-10 w-auto rounded-full py-0" aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </>
        }
      />
      <Table>
        <thead>
          <tr>
            <th className={th}>Order</th>
            <th className={th}>Customer</th>
            <th className={th}>Date</th>
            <th className={th}>Items</th>
            <th className={th}>Total</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={6} className={td}><Skeleton className="h-8" /></td></tr>)
            : data?.data.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2/50">
                  <td className={td}><Link to={`/admin/orders/${o.id}`} className="font-medium text-gold hover:underline">{o.number}</Link></td>
                  <td className={td}>
                    <p>{o.customer?.name}</p>
                    <p className="text-xs text-muted">{o.customer?.email}</p>
                  </td>
                  <td className={`${td} text-muted`}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className={td}>{o.items_count}</td>
                  <td className={`${td} font-medium`}>{formatMoney(o.total, o.currency)}</td>
                  <td className={td}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
        </tbody>
      </Table>
      {data && <Pagination page={page} lastPage={data.meta.last_page} onChange={(p) => set({ page: String(p) })} />}
    </div>
  )
}
