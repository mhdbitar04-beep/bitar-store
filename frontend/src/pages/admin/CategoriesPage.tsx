import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Modal } from '@/components/admin/Modal'
import { PageHeader, Table, td, th } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminCategories, useDeleteCategory, useSaveCategory } from '@/features/admin/api'
import { applyFieldErrors } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError, Category } from '@/types/api'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and dashes').optional().or(z.literal('')),
  parent_id: z.string().optional(),
  description: z.string().max(2000).optional(),
  sort_order: z.string().regex(/^\d*$/).optional(),
  is_active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export default function AdminCategoriesPage() {
  useDocumentTitle('Categories · Admin')
  const { data, isLoading } = useAdminCategories()
  const remove = useDeleteCategory()
  const [editing, setEditing] = useState<Category | null | undefined>(undefined) // undefined = closed, null = new

  const ordered = (data ?? []).filter((c) => !c.parent_id).flatMap((p) => [p, ...(data ?? []).filter((c) => c.parent_id === p.id)])

  return (
    <div>
      <PageHeader
        title="Categories"
        actions={<Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> New category</Button>}
      />
      <Table>
        <thead>
          <tr>
            <th className={th}>Name</th>
            <th className={th}>Slug</th>
            <th className={th}>Products</th>
            <th className={th}>Status</th>
            <th className={th}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5} className={td}><Skeleton className="h-8" /></td></tr>)
            : ordered.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/50">
                  <td className={td}><span className={c.parent_id ? 'pl-6 text-muted' : 'font-medium'}>{c.parent_id ? '↳ ' : ''}{c.name}</span></td>
                  <td className={`${td} text-muted`}>{c.slug}</td>
                  <td className={td}>{c.products_count}</td>
                  <td className={td}><Badge className={c.is_active ? 'bg-success/15 text-success' : 'bg-muted/20 text-muted'}>{c.is_active ? 'Active' : 'Hidden'}</Badge></td>
                  <td className={`${td} text-right`}>
                    <button className="cursor-pointer rounded-full p-2 hover:text-gold" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
                    <button
                      className="cursor-pointer rounded-full p-2 hover:text-danger"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => {
                        if (!window.confirm(`Delete "${c.name}"?`)) return
                        remove.mutate(c.id, {
                          onSuccess: () => toast.success('Category deleted'),
                          onError: (e) => toast.error((e as unknown as ApiError).message),
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </Table>

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit category' : 'New category'}>
        {editing !== undefined && <CategoryForm key={editing?.id ?? 'new'} category={editing} parents={(data ?? []).filter((c) => !c.parent_id && c.id !== editing?.id)} onDone={() => setEditing(undefined)} />}
      </Modal>
    </div>
  )
}

function CategoryForm({ category, parents, onDone }: { category: Category | null; parents: Category[]; onDone: () => void }) {
  const save = useSaveCategory()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      parent_id: category?.parent_id ? String(category.parent_id) : '',
      description: category?.description ?? '',
      sort_order: String(category?.sort_order ?? 0),
      is_active: category?.is_active ?? true,
    },
  })

  const onSubmit = (f: FormValues) =>
    save.mutate(
      {
        id: category?.id,
        input: {
          name: f.name,
          slug: f.slug || undefined,
          parent_id: f.parent_id ? Number(f.parent_id) : null,
          description: f.description || null,
          sort_order: Number(f.sort_order || 0),
          is_active: f.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success(category ? 'Category updated' : 'Category created')
          onDone()
        },
        onError: (e) => applyFieldErrors<keyof FormValues>(e as unknown as ApiError, setError),
      },
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input label="Name" {...register('name')} error={errors.name?.message} />
      <Input label="Slug" hint="Generated from the name if empty" {...register('slug')} error={errors.slug?.message} />
      <Select label="Parent" {...register('parent_id')} error={errors.parent_id?.message}>
        <option value="">None (top level)</option>
        {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      <Textarea label="Description" {...register('description')} />
      <Input label="Sort order" type="number" min={0} {...register('sort_order')} />
      <Checkbox label="Active" {...register('is_active')} />
      <Button type="submit" className="w-full" loading={save.isPending}>Save</Button>
    </form>
  )
}
