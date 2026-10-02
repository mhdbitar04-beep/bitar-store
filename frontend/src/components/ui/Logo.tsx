import { Link } from 'react-router'
import { cn } from '@/lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('group flex items-center gap-2', className)} aria-label="BITAR STORE home">
      <span className="gold-gradient flex h-9 w-9 items-center justify-center rounded-xl font-display text-lg font-bold text-on-gold transition-transform duration-300 group-hover:rotate-6">
        B
      </span>
      <span className="font-display text-base font-semibold tracking-[0.15em] whitespace-nowrap sm:text-lg sm:tracking-[0.2em]">
        BITAR <span className="gold-text">STORE</span>
      </span>
    </Link>
  )
}
