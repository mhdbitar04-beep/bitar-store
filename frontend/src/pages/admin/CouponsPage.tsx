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
import { Checkbox, Input, Select } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminCoupons, useDeleteCoupon, useSaveCoupon } from '@/features/admin/api'
import { applyFieldErrors } from '@/lib/api'
import { formatMoney, toCents, toDollars } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError, Coupon } from '@/types/api'

const int = z.string().regex(/^\d*$/, 'Whole number')
const schema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _'),
  type: z.enum(['percent', 'fixed']),
  value: z.string().min(1, 'Required'),
  min_order_amount: z.string().optional(),
  max_discount: z.string().optional(),
  usage_limit: int.optional(),
  per_user_limit: int.optional(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const describe = (c: Coupon) => (c.type === 'percent' ? `${c.value}% off` : `${formatMoney(c.value)} off`)
const isExpired = (c: Coupon) => !!c.expires_at && new Date(c.expires_at) < new Date()
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '')

export default function AdminCouponsPage() {
  useDocumentTitle('Coupons · Admin')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminCoupons(page)
  const remove = useDeleteCoupon()
  const [editing, setEditing] = useState<Coupon | null | undefined>(undefined)

  return (
    <div>
      <PageHeader title="Coupons" actions={<Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> New coupon</Button>} />
      <Table>
        <thead>
          <tr>
            <th className={th}>Code</th>
            <th className={th}>Discount</th>
            <th className={th}>Rules</th>
            <th className={th}>Used</th>
            <th className={th}>Status</th>
            <th className={th}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className={td}><Skeleton className="h-8" /></td></tr>)
            : data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/50">
                  <td className={`${td} font-mono font-semibold text-gold`}>{c.code}</td>
                  <td className={td}>{describe(c)}</td>
                  <td className={`${td} text-xs text-muted`}>
                    {c.min_order_amount ? `Min ${formatMoney(c.min_order_amount)}` : 'No minimum'}
                    {c.max_discount ? ` · Max ${formatMoney(c.max_discount)}` : ''}
                    {c.per_user_limit ? ` · ${c.per_user_limit}/customer` : ''}
                    {c.expires_at ? ` · until ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                  </td>
                  <td className={td}>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                  <td className={td}>
                    <Badge className={!c.is_active || isExpired(c) ? 'bg-muted/20 text-muted' : 'bg-success/15 text-success'}>
                      {!c.is_active ? 'Disabled' : isExpired(c) ? 'Expired' : 'Active'}
                    </Badge>
                  </td>
                  <td className={`${td} text-right`}>
                    <button className="cursor-pointer rounded-full p-2 hover:text-gold" onClick={() => setEditing(c)} aria-label={`Edit ${c.code}`}><Pencil className="h-4 w-4" /></button>
                    <button
                      className="cursor-pointer rounded-full p-2 hover:text-danger"
                      aria-label={`Delete ${c.code}`}
                      onClick={() => window.confirm(`Delete coupon ${c.code}?`) && remove.mutate(c.id, { onSuccess: () => toast.success('Coupon deleted') })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </Table>
      {data && <Pagination page={page} lastPage={data.meta.last_page} onChange={setPage} />}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? `Edit ${editing.code}` : 'New coupon'}>
        {editing !== undefined && <CouponForm key={editing?.id ?? 'new'} coupon={editing} onDone={() => setEditing(undefined)} />}
      </Modal>
    </div>
  )
}

function CouponForm({ coupon, onDone }: { coupon: Coupon | null; onDone: () => void }) {
  const save = useSaveCoupon()
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: coupon?.code ?? '',
      type: coupon?.type ?? 'percent',
      value: coupon ? (coupon.type === 'fixed' ? toDollars(coupon.value) : String(coupon.value)) : '',
      min_order_amount: toDollars(coupon?.min_order_amount),
      max_discount: toDollars(coupon?.max_discount),
      usage_limit: coupon?.usage_limit ? String(coupon.usage_limit) : '',
      per_user_limit: coupon?.per_user_limit ? String(coupon.per_user_limit) : '',
      starts_at: toLocalInput(coupon?.starts_at ?? null),
      expires_at: toLocalInput(coupon?.expires_at ?? null),
      is_active: coupon?.is_active ?? true,
    },
  })
  const type = watch('type')

  const onSubmit = (f: FormValues) =>
    save.mutate(
      {
        id: coupon?.id,
        input: {
          code: f.code.toUpperCase(),
          type: f.type,
          value: f.type === 'fixed' ? toCents(f.value) : Number(f.value),
          min_order_amount: f.min_order_amount ? toCents(f.min_order_amount) : null,
          max_discount: f.max_discount ? toCents(f.max_discount) : null,
          usage_limit: f.usage_limit ? Number(f.usage_limit) : null,
          per_user_limit: f.per_user_limit ? Number(f.per_user_limit) : null,
          starts_at: f.starts_at || null,
          expires_at: f.expires_at || null,
          is_active: f.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success(coupon ? 'Coupon updated' : 'Coupon created')
          onDone()
        },
        onError: (e) => applyFieldErrors<keyof FormValues>(e as unknown as ApiError, setError),
      },
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Input label="Code" className="uppercase" wrapperClassName="sm:col-span-2" {...register('code')} error={errors.code?.message} />
      <Select label="Type" {...register('type')}>
        <option value="percent">Percentage</option>
        <option value="fixed">Fixed amount</option>
      </Select>
      <Input label={type === 'percent' ? 'Percent off' : 'Amount off (USD)'} inputMode="decimal" {...register('value')} error={errors.value?.message} />
      <Input label="Minimum order (USD)" inputMode="decimal" {...register('min_order_amount')} error={errors.min_order_amount?.message} />
      <Input label="Max discount (USD)" inputMode="decimal" {...register('max_discount')} error={errors.max_discount?.message} />
      <Input label="Total uses" type="number" min={1} {...register('usage_limit')} error={errors.usage_limit?.message} />
      <Input label="Uses per customer" type="number" min={1} {...register('per_user_limit')} error={errors.per_user_limit?.message} />
      <Input label="Starts" type="datetime-local" {...register('starts_at')} error={errors.starts_at?.message} />
      <Input label="Expires" type="datetime-local" {...register('expires_at')} error={errors.expires_at?.message} />
      <Checkbox label="Active" className="sm:col-span-2" {...register('is_active')} />
      <Button type="submit" className="w-full sm:col-span-2" loading={save.isPending}>Save coupon</Button>
    </form>
  )
}
