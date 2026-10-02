import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { PageHeader, Table, td, th } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Img } from '@/components/ui/Img'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminProducts, useDeleteProduct } from '@/features/admin/api'
import { useDebounced } from '@/lib/useDebounced'
import { formatMoney } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function AdminProductsPage() {
  useDocumentTitle('Products · Admin')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const { data, isLoading } = useAdminProducts({ page, search: debounced || undefined })
  const remove = useDeleteProduct()

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.meta.total} products` : undefined}
        actions={
          <>
            <label className="relative">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Name or SKU…" className="field h-10 w-56 rounded-full pl-9" />
            </label>
            <Link to="/admin/products/new" className="gold-gradient inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-on-gold">
              <Plus className="h-4 w-4" /> New product
            </Link>
          </>
        }
      />

      <Table>
        <thead>
          <tr>
            <th className={th}>Product</th>
            <th className={th}>Category</th>
            <th className={th}>Price</th>
            <th className={th}>Stock</th>
            <th className={th}>Status</th>
            <th className={th}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td className={td} colSpan={6}><Skeleton className="h-10" /></td></tr>
              ))
            : data?.data.map((p) => (
                <tr key={p.id} className="transition-colors duration-200 hover:bg-surface-2/50">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Img src={p.primary_image?.url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted">{p.variants?.length ?? 0} variant(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} text-muted`}>{p.category?.name}</td>
                  <td className={td}>{formatMoney(p.price_min)}{p.price_max > p.price_min && <span className="text-muted"> – {formatMoney(p.price_max)}</span>}</td>
                  <td className={td}>
                    <span className={(p.total_stock ?? 0) <= 5 ? 'font-semibold text-amber-500' : ''}>{p.total_stock}</span>
                  </td>
                  <td className={td}>
                    <div className="flex gap-1">
                      <Badge className={p.is_active ? 'bg-success/15 text-success' : 'bg-muted/20 text-muted'}>{p.is_active ? 'Active' : 'Hidden'}</Badge>
                      {p.is_featured && <Badge className="bg-gold/15 text-gold">Featured</Badge>}
                    </div>
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/products/${p.id}`} className="rounded-full p-2 hover:bg-surface-2 hover:text-gold" aria-label={`Edit ${p.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="cursor-pointer rounded-full p-2 hover:bg-danger/10 hover:text-danger"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => {
                          if (!window.confirm(`Delete "${p.name}"? It will be hidden from the store.`)) return
                          remove.mutate(p.id, { onSuccess: () => toast.success('Product deleted') })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </Table>
      {data && <Pagination page={page} lastPage={data.meta.last_page} onChange={setPage} />}
    </div>
  )
}
