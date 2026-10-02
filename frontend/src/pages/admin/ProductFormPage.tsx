import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ImagePlus, Plus, Star, Trash2, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/Field'
import { Img } from '@/components/ui/Img'
import { PageLoader } from '@/components/ui/Spinner'
import {
  useAdminCategories,
  useAdminProduct,
  useAttributes,
  useDeleteImage,
  useMakePrimaryImage,
  useSaveProduct,
  useUploadImages,
  type AdminProductInput,
} from '@/features/admin/api'
import { applyFieldErrors } from '@/lib/api'
import { cn } from '@/lib/cn'
import { base } from '@/lib/motion'
import { toCents, toDollars } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError, Product } from '@/types/api'

const money = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a price like 49.99')
const optionalMoney = z.union([money, z.literal('')])

const schema = z.object({
  name: z.string().trim().min(2, 'Required').max(255),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and dashes').optional().or(z.literal('')),
  category_id: z.string().min(1, 'Choose a category'),
  short_description: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  base_price: money,
  compare_at_price: optionalMoney.optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  has_variants: z.boolean(),
  stock: z.string().regex(/^\d*$/, 'Whole number').optional(),
  variants: z.array(
    z.object({
      id: z.number().optional(),
      sku: z.string().max(64).optional(),
      price: optionalMoney.optional(),
      stock: z.string().regex(/^\d+$/, 'Required'),
      values: z.record(z.string(), z.string()),
    }),
  ),
})
type FormValues = z.infer<typeof schema>

const toForm = (p?: Product): FormValues => {
  const hasVariants = !!p?.variants?.some((v) => (v.attribute_values?.length ?? 0) > 0)
  return {
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    category_id: p?.category?.id ? String(p.category.id) : '',
    short_description: p?.short_description ?? '',
    description: p?.description ?? '',
    base_price: p ? toDollars(p.base_price) : '',
    compare_at_price: p?.compare_at_price ? toDollars(p.compare_at_price) : '',
    is_active: p?.is_active ?? true,
    is_featured: p?.is_featured ?? false,
    has_variants: hasVariants,
    stock: String(p?.variants?.[0]?.stock ?? 0),
    variants: hasVariants
      ? p!.variants!.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: v.price_override != null ? toDollars(v.price_override) : '',
          stock: String(v.stock),
          values: Object.fromEntries((v.attribute_values ?? []).map((av) => [String(av.attribute_id), String(av.id)])),
        }))
      : [],
  }
}

export default function ProductFormPage() {
  const { id } = useParams()
  const productId = id ? Number(id) : undefined
  const { data: product, isLoading } = useAdminProduct(productId)
  useDocumentTitle(productId ? 'Edit product · Admin' : 'New product · Admin')

  if (productId && isLoading) return <PageLoader />
  return <ProductForm key={product?.id ?? 'new'} product={product} />
}

function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const { data: categories } = useAdminCategories()
  const { data: attributes } = useAttributes()
  const save = useSaveProduct(product?.id)
  const upload = useUploadImages(product?.id)
  const deleteImage = useDeleteImage()
  const makePrimary = useMakePrimaryImage()
  const [files, setFiles] = useState<File[]>([])
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const { register, control, handleSubmit, watch, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toForm(product),
  })
  const variants = useFieldArray({ control, name: 'variants' })
  const hasVariants = watch('has_variants')

  // Attributes currently used by the variant builder.
  const initialAttrs = useMemo(
    () => [...new Set(product?.variants?.flatMap((v) => v.attribute_values?.map((av) => av.attribute_id) ?? []) ?? [])],
    [product],
  )
  const [usedAttrs, setUsedAttrs] = useState<number[]>(initialAttrs)
  const activeAttributes = attributes?.filter((a) => usedAttrs.includes(a.id)) ?? []

  const generateCombinations = () => {
    if (activeAttributes.length === 0) return toast.error('Pick at least one option type first')
    let combos: Record<string, string>[] = [{}]
    for (const attr of activeAttributes) {
      combos = combos.flatMap((c) => attr.values.map((v) => ({ ...c, [String(attr.id)]: String(v.id) })))
    }
    variants.replace(combos.map((values) => ({ sku: '', price: '', stock: '0', values })))
  }

  const onSubmit = (form: FormValues) => {
    const input: AdminProductInput = {
      name: form.name,
      slug: form.slug || undefined,
      category_id: Number(form.category_id),
      short_description: form.short_description || null,
      description: form.description || null,
      base_price: toCents(form.base_price),
      compare_at_price: form.compare_at_price ? toCents(form.compare_at_price) : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      ...(form.has_variants
        ? {
            variants: form.variants.map((v) => ({
              id: v.id,
              sku: v.sku || undefined,
              price: v.price ? toCents(v.price) : null,
              stock: Number(v.stock),
              attribute_value_ids: activeAttributes.map((a) => Number(v.values[String(a.id)])).filter(Boolean),
            })),
          }
        : { stock: Number(form.stock || 0), variants: [] }),
    }

    save.mutate(input, {
      onSuccess: async (saved) => {
        if (files.length) {
          await upload.mutateAsync({ files, id: saved.id }).catch(() => toast.error('Product saved but image upload failed'))
          setFiles([])
        }
        toast.success(product ? 'Product updated' : 'Product created')
        navigate(product ? '/admin/products' : `/admin/products/${saved.id}`, { replace: !product })
      },
      onError: (e) => {
        const err = e as unknown as ApiError
        applyFieldErrors<keyof FormValues>(err, setError)
        toast.error(err.message)
      },
    })
  }

  // Parents followed by their children, for an indented <select>.
  const flatCategories = (categories ?? [])
    .filter((c) => !c.parent_id)
    .flatMap((parent) => [parent, ...(categories ?? []).filter((c) => c.parent_id === parent.id)])

  return (
    <div>
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader title={product ? `Edit: ${product.name}` : 'New product'} />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1fr_360px]" noValidate>
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="font-sans text-base font-semibold">Basics</h2>
            <Input label="Name" {...register('name')} error={errors.name?.message} />
            <Input label="Slug" hint="Leave empty to generate from the name" {...register('slug')} error={errors.slug?.message} />
            <Input label="Short description" {...register('short_description')} error={errors.short_description?.message} />
            <Textarea label="Description" rows={6} {...register('description')} error={errors.description?.message} />
          </section>

          <section className="card space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-sans text-base font-semibold">Inventory & options</h2>
              <Checkbox label="This product has options (size, color…)" {...register('has_variants')} />
            </div>

            {!hasVariants ? (
              <Input label="Stock" type="number" min={0} {...register('stock')} error={errors.stock?.message} wrapperClassName="max-w-40" />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="field-label">Option types</p>
                  <div className="flex flex-wrap gap-2">
                    {attributes?.map((a) => {
                      const on = usedAttrs.includes(a.id)
                      return (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => setUsedAttrs((u) => (on ? u.filter((x) => x !== a.id) : [...u, a.id]))}
                          className={cn('cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors duration-200', on ? 'gold-gradient border-transparent text-on-gold' : 'border-line hover:border-gold')}
                          aria-pressed={on}
                        >
                          {a.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={generateCombinations}>
                    <Wand2 className="h-4 w-4" /> Generate all combinations
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => variants.append({ sku: '', price: '', stock: '0', values: {} })}>
                    <Plus className="h-4 w-4" /> Add variant
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted uppercase">
                        {activeAttributes.map((a) => <th key={a.id} className="pb-2 font-semibold">{a.name}</th>)}
                        <th className="pb-2 font-semibold">SKU</th>
                        <th className="pb-2 font-semibold">Price override</th>
                        <th className="pb-2 font-semibold">Stock</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {variants.fields.map((field, index) => (
                          <motion.tr key={field.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={base}>
                            {activeAttributes.map((a) => (
                              <td key={a.id} className="py-1 pr-2">
                                <select className="field py-2" {...register(`variants.${index}.values.${a.id}` as const)} aria-label={a.name}>
                                  <option value="">—</option>
                                  {a.values.map((v) => <option key={v.id} value={v.id}>{v.value}</option>)}
                                </select>
                              </td>
                            ))}
                            <td className="py-1 pr-2"><input className="field py-2" placeholder="Auto" {...register(`variants.${index}.sku`)} aria-label="SKU" /></td>
                            <td className="py-1 pr-2"><input className="field py-2" placeholder="Base" inputMode="decimal" {...register(`variants.${index}.price`)} aria-label="Price override" /></td>
                            <td className="py-1 pr-2">
                              <input className={cn('field w-24 py-2', errors.variants?.[index]?.stock && 'border-danger')} inputMode="numeric" {...register(`variants.${index}.stock`)} aria-label="Stock" />
                            </td>
                            <td className="py-1">
                              <button type="button" onClick={() => variants.remove(index)} className="cursor-pointer rounded-full p-2 text-muted hover:text-danger" aria-label="Remove variant">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  {variants.fields.length === 0 && <p className="py-4 text-sm text-muted">No variants yet — generate combinations or add one.</p>}
                  {errors.variants?.root?.message && <p className="field-error">{errors.variants.root.message}</p>}
                </div>
              </div>
            )}
          </section>

          <section className="card space-y-4 p-6">
            <h2 className="font-sans text-base font-semibold">Images</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {product?.images?.map((img) => (
                <div key={img.id} className={cn('group relative aspect-square overflow-hidden rounded-xl border-2', img.is_primary ? 'border-gold' : 'border-line')}>
                  <Img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                    {!img.is_primary && (
                      <button type="button" onClick={() => makePrimary.mutate(img.id)} className="cursor-pointer rounded-full bg-black/60 p-2 text-gold" aria-label="Set as main image">
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button type="button" onClick={() => deleteImage.mutate(img.id)} className="cursor-pointer rounded-full bg-black/60 p-2 text-white hover:text-danger" aria-label="Delete image">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {img.is_primary && <span className="gold-gradient absolute bottom-1 left-1 rounded-full px-2 text-[10px] font-bold text-on-gold">Main</span>}
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gold/60">
                  <img src={src} alt="" className="h-full w-full object-cover opacity-80" />
                  <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} className="absolute top-1 right-1 cursor-pointer rounded-full bg-black/70 p-1 text-white" aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-xs text-muted transition-colors duration-200 hover:border-gold hover:text-gold">
                <ImagePlus className="h-6 w-6" />
                Add images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    setFiles((f) => [...f, ...Array.from(e.target.files ?? [])].slice(0, 10))
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted">JPG, PNG or WebP, up to 4 MB each. New images upload when you save.</p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="font-sans text-base font-semibold">Pricing</h2>
            <Input label="Price (USD)" inputMode="decimal" placeholder="49.99" {...register('base_price')} error={errors.base_price?.message} />
            <Input label="Compare-at price (USD)" inputMode="decimal" placeholder="Optional" hint="Shown struck-through when higher than the price" {...register('compare_at_price')} error={errors.compare_at_price?.message} />
          </section>
          <section className="card space-y-4 p-6">
            <h2 className="font-sans text-base font-semibold">Organisation</h2>
            <Select label="Category" {...register('category_id')} error={errors.category_id?.message}>
              <option value="">Select…</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.parent_id ? `— ${c.name}` : c.name}</option>
              ))}
            </Select>
            <Checkbox label="Visible in store" {...register('is_active')} />
            <Checkbox label="Featured on home page" {...register('is_featured')} />
          </section>
          <Button type="submit" size="lg" className="w-full" loading={save.isPending || upload.isPending}>
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </aside>
      </form>
    </div>
  )
}
