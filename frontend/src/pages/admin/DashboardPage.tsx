import { motion } from 'framer-motion'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, DollarSign, Receipt, ShoppingBag, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDashboard } from '@/features/admin/api'
import { cn } from '@/lib/cn'
import { fadeUp, stagger } from '@/lib/motion'
import { formatMoney } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { OrderStatus } from '@/types/api'

const RANGES = [7, 30, 90] as const
const axis = { stroke: 'var(--muted)', fontSize: 11, tickLine: false, axisLine: false } as const
const shortDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: { value: number }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-card">
      <p className="text-muted">{label && /^\d{4}-/.test(label) ? shortDate(label) : label}</p>
      <p className="font-semibold text-fg">{money ? formatMoney(payload[0].value) : payload[0].value}</p>
    </div>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Admin dashboard')
  const [days, setDays] = useState<number>(30)
  const { data, isLoading } = useDashboard(days)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Performance over the last ${days} days`}
        actions={
          <div className="card flex p-1" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                aria-pressed={days === r}
                className={cn('relative cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-200', days === r ? 'text-on-gold' : 'text-muted hover:text-fg')}
              >
                {days === r && <motion.span layoutId="range" className="gold-gradient absolute inset-0 rounded-lg" transition={{ duration: 0.25 }} />}
                <span className="relative">{r}d</span>
              </button>
            ))}
          </div>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
          <Skeleton className="h-80 sm:col-span-2 xl:col-span-4" />
        </div>
      ) : (
        <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={<DollarSign />} label="Revenue" value={formatMoney(data.kpis.revenue)} change={data.kpis.revenue_change} />
            <Kpi icon={<ShoppingBag />} label="Paid orders" value={String(data.kpis.orders)} change={data.kpis.orders_change} />
            <Kpi icon={<Receipt />} label="Avg. order value" value={formatMoney(data.kpis.average_order_value)} />
            <Kpi icon={<Users />} label="New customers" value={String(data.kpis.new_customers)} />
          </div>

          {(data.kpis.pending_orders > 0 || data.kpis.low_stock_variants > 0) && (
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 text-sm">
              {data.kpis.pending_orders > 0 && (
                <Link to="/admin/orders?status=pending" className="card flex items-center gap-2 px-4 py-2 hover:border-gold/60">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> {data.kpis.pending_orders} orders awaiting payment
                </Link>
              )}
              {data.kpis.low_stock_variants > 0 && (
                <Link to="/admin/products" className="card flex items-center gap-2 px-4 py-2 hover:border-gold/60">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> {data.kpis.low_stock_variants} variants low on stock (≤ 5)
                </Link>
              )}
            </motion.div>
          )}

          <motion.section variants={fadeUp} className="card p-6" aria-labelledby="sales-title">
            <h2 id="sales-title" className="mb-1 font-sans text-base font-semibold">Sales over time</h2>
            <p className="mb-6 text-xs text-muted">Daily revenue from paid orders</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sales_over_time} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
                  <YAxis tickFormatter={(v: number) => `$${Math.round(v / 100).toLocaleString()}`} width={64} {...axis} />
                  <Tooltip content={<ChartTooltip money />} cursor={{ stroke: 'var(--gold)', strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2} fill="url(#goldFill)" activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }} animationDuration={400} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          <div className="grid gap-6 xl:grid-cols-2">
            <motion.section variants={fadeUp} className="card p-6" aria-labelledby="orders-title">
              <h2 id="orders-title" className="mb-1 font-sans text-base font-semibold">Orders per day</h2>
              <p className="mb-6 text-xs text-muted">Count of paid orders</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sales_over_time} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                    <Bar dataKey="orders" fill="var(--gold)" radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={400} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            <motion.section variants={fadeUp} className="card p-6" aria-labelledby="top-title">
              <h2 id="top-title" className="mb-1 font-sans text-base font-semibold">Best-selling products</h2>
              <p className="mb-6 text-xs text-muted">Units sold in period</p>
              {data.top_products.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_products} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis type="category" dataKey="name" width={150} {...axis} tick={{ fill: 'var(--fg)', fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                      <Bar dataKey="quantity" fill="var(--gold)" radius={[0, 4, 4, 0]} barSize={16} label={{ position: 'right', fill: 'var(--muted)', fontSize: 11 }} animationDuration={400} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted">No sales in this period.</p>
              )}
            </motion.section>
          </div>

          <motion.section variants={fadeUp} className="card p-6" aria-labelledby="status-title">
            <h2 id="status-title" className="mb-4 font-sans text-base font-semibold">Orders by status (all time)</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.entries(data.orders_by_status) as [OrderStatus, number][]).map(([status, count]) => (
                <li key={status}>
                  <Link to={`/admin/orders?status=${status}`} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 transition-colors duration-200 hover:border-gold/60">
                    <StatusBadge status={status} />
                    <span className="font-semibold tabular-nums">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        </motion.div>
      )}
    </div>
  )
}

function Kpi({ icon, label, value, change }: { icon: ReactNode; label: string; value: string; change?: number | null }) {
  const up = (change ?? 0) >= 0
  return (
    <motion.div variants={fadeUp} className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {change != null && (
        <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', up ? 'text-success' : 'text-danger')}>
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(change)}% vs previous period
        </p>
      )}
    </motion.div>
  )
}
