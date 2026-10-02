import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/Field'
import { useCategories, type ProductFilters } from '@/features/products/api'
import { cn } from '@/lib/cn'

interface Props {
  filters: ProductFilters
  onChange: (patch: Partial<ProductFilters>) => void
  onReset: () => void
}

export function Filters({ filters, onChange, onReset }: Props) {
  const { data: categories } = useCategories()
  const [min, setMin] = useState(filters.min_price ? String(filters.min_price / 100) : '')
  const [max, setMax] = useState(filters.max_price ? String(filters.max_price / 100) : '')

  useEffect(() => {
    setMin(filters.min_price ? String(filters.min_price / 100) : '')
    setMax(filters.max_price ? String(filters.max_price / 100) : '')
  }, [filters.min_price, filters.max_price])

  const applyPrice = () =>
    onChange({
      min_price: min ? Math.round(Number(min) * 100) : undefined,
      max_price: max ? Math.round(Number(max) * 100) : undefined,
    })

  const catBtn = (active: boolean) =>
    cn(
      'block w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm transition-colors duration-200',
      active ? 'bg-gold/10 font-medium text-gold' : 'text-muted hover:text-fg',
    )

  return (
    <div className="space-y-8">
      <section>
        <h3 className="eyebrow mb-3">Category</h3>
        <button className={catBtn(!filters.category)} onClick={() => onChange({ category: undefined })}>
          All products
        </button>
        {categories?.map((cat) => (
          <div key={cat.id}>
            <button className={catBtn(filters.category === cat.slug)} onClick={() => onChange({ category: cat.slug })}>
              {cat.name} <span className="text-xs opacity-60">({(cat.products_count ?? 0) + (cat.children?.reduce((s, c) => s + (c.products_count ?? 0), 0) ?? 0)})</span>
            </button>
            <div className="ml-3 border-l border-line pl-2">
              {cat.children?.map((child) => (
                <button key={child.id} className={catBtn(filters.category === child.slug)} onClick={() => onChange({ category: child.slug })}>
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="eyebrow mb-3">Price (USD)</h3>
        <div className="flex items-center gap-2">
          <input type="number" min={0} inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} onBlur={applyPrice} className="field" aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <input type="number" min={0} inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} className="field" aria-label="Maximum price" />
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-3">Rating</h3>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button key={r} className={catBtn(filters.rating === r)} onClick={() => onChange({ rating: filters.rating === r ? undefined : r })}>
              <span className="inline-flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('h-3.5 w-3.5', i < r ? 'text-gold' : 'text-line')} fill="currentColor" strokeWidth={0} />
                ))}
                <span className="ml-1">& up</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-3">Availability</h3>
        <Checkbox label="In stock only" checked={!!filters.in_stock} onChange={(e) => onChange({ in_stock: e.target.checked || undefined })} />
      </section>

      <button onClick={onReset} className="cursor-pointer text-sm text-gold underline-offset-4 hover:underline">
        Clear all filters
      </button>
    </div>
  )
}
