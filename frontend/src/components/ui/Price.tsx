import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/cn'

interface PriceProps {
  amount: number
  compareAt?: number | null
  from?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Price({ amount, compareAt, from, className, size = 'md' }: PriceProps) {
  const onSale = compareAt != null && compareAt > amount
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-semibold text-gold', size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-base')}>
        {from && <span className="mr-1 text-xs font-normal text-muted">from</span>}
        {formatMoney(amount)}
      </span>
      {onSale && <span className="text-sm text-muted line-through">{formatMoney(compareAt)}</span>}
    </div>
  )
}
