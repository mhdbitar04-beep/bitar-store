import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Pagination({ page, lastPage, onChange }: { page: number; lastPage: number; onChange: (p: number) => void }) {
  if (lastPage <= 1) return null

  const pages = Array.from({ length: lastPage }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1,
  )

  const btn = 'flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm transition-colors duration-200'

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <button className={cn(btn, 'hover:bg-surface-2 disabled:opacity-40')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
          <button
            className={cn(btn, p === page ? 'gold-gradient font-semibold text-on-gold' : 'hover:bg-surface-2')}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        </span>
      ))}
      <button className={cn(btn, 'hover:bg-surface-2 disabled:opacity-40')} disabled={page >= lastPage} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
