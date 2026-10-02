import { AnimatePresence, motion } from 'framer-motion'
import { Img } from '@/components/ui/Img'
import { fast } from '@/lib/motion'
import { formatMoney } from '@/lib/money'

interface Line {
  key: number | string
  name: string
  variant?: string | null
  image?: string | null
  quantity: number
  total: number
}

interface Totals {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  currency?: string
  couponCode?: string | null
}

export function OrderSummary({ lines, totals }: { lines: Line[]; totals: Totals }) {
  const c = totals.currency ?? 'usd'
  const row = (label: string, value: string, className = '') => (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-muted">{label}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={fast}>
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )

  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Img src={l.image ?? undefined} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
              <span className="gold-gradient absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-on-gold">
                {l.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.name}</p>
              {l.variant && <p className="text-xs text-muted">{l.variant}</p>}
            </div>
            <span className="text-sm font-medium">{formatMoney(l.total, c)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t border-line pt-4">
        {row('Subtotal', formatMoney(totals.subtotal, c))}
        {totals.discount > 0 && row(`Discount${totals.couponCode ? ` (${totals.couponCode})` : ''}`, `−${formatMoney(totals.discount, c)}`, 'text-success')}
        {row('Shipping', totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping, c))}
        {totals.tax > 0 && row('Tax', formatMoney(totals.tax, c))}
      </div>
      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="font-medium">Total</span>
        <motion.span key={totals.total} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={fast} className="font-display text-2xl text-gold">
          {formatMoney(totals.total, c)}
        </motion.span>
      </div>
    </div>
  )
}
