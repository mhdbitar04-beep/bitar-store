import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/types/api'

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>{children}</span>
  )
}

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-500',
  paid: 'bg-gold/15 text-gold',
  processing: 'bg-sky-500/15 text-sky-400',
  shipped: 'bg-indigo-500/15 text-indigo-400',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-danger/15 text-danger',
  refunded: 'bg-muted/20 text-muted',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={cn('capitalize', statusStyles[status])}>{status}</Badge>
}
