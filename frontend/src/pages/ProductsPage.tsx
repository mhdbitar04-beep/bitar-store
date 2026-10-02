import { AnimatePresence, motion } from 'framer-motion'
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Filters } from '@/components/product/Filters'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { useProducts, type ProductFilters } from '@/features/products/api'
import { base } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

const SORTS: { value: NonNullable<ProductFilters['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Best selling' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
]

const num = (v: string | null) => (v ? Number(v) : undefined)

export default function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)

  // The URL is the single source of truth for filters (shareable, back-button friendly).
  const filters: ProductFilters = useMemo(
    () => ({
      search: params.get('search') ?? undefined,
      category: params.get('category') ?? undefined,
      min_price: num(params.get('min_price')),
      max_price: num(params.get('max_price')),
      rating: num(params.get('rating')),
      in_stock: params.get('in_stock') === '1' || undefined,
      sort: (params.get('sort') as ProductFilters['sort']) ?? 'newest',
      page: num(params.get('page')) ?? 1,
      per_page: 12,
    }),
    [params],
  )

  const { data, isLoading, isFetching, isError, error } = useProducts(filters)
  useDocumentTitle(filters.search ? `Search: ${filters.search}` : 'Shop')

  const update = (patch: Partial<ProductFilters>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === false) next.delete(k)
      else next.set(k, v === true ? '1' : String(v))
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next)
    if ('page' in patch) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => setParams(new URLSearchParams())
  const gridKey = JSON.stringify({ ...filters, page: undefined })

  return (
    <div className="container-x py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">The collection</p>
          <h1 className="text-4xl sm:text-5xl">{filters.search ? `“${filters.search}”` : 'All products'}</h1>
          {data && <p className="mt-2 text-sm text-muted">{data.meta.total} products</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value as ProductFilters['sort'] })} className="field h-9 w-auto cursor-pointer rounded-full py-0">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28">
            <Filters filters={filters} onChange={update} onReset={reset} />
          </div>
        </aside>

        <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity duration-200' : 'transition-opacity duration-200'}>
          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : isError ? (
            <EmptyState icon={<PackageSearch className="h-7 w-7" />} title="Couldn't load products" description={(error as { message?: string }).message} />
          ) : data && data.data.length > 0 ? (
            <>
              <ProductGrid products={data.data} gridKey={gridKey + filters.page} />
              <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} onChange={(page) => update({ page })} />
            </>
          ) : (
            <EmptyState
              icon={<PackageSearch className="h-7 w-7" />}
              title="No products found"
              description="Try removing some filters or searching for something else."
              action={<Button onClick={reset}>Clear filters</Button>}
            />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-r border-line bg-bg p-6 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={base}
              role="dialog"
              aria-label="Filters"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl">Filters</h2>
                <button onClick={() => setDrawer(false)} className="cursor-pointer p-2" aria-label="Close filters"><X className="h-5 w-5" /></button>
              </div>
              <Filters filters={filters} onChange={(p) => update(p)} onReset={reset} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
