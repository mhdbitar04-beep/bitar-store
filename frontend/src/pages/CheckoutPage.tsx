import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { CreditCard, ShoppingBag, Tag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { PaymentStep } from '@/components/checkout/PaymentStep'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Textarea } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCartQuote } from '@/features/cart/api'
import { useAddresses, useCheckout } from '@/features/orders/api'
import { applyFieldErrors } from '@/lib/api'
import { base } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useCartStore } from '@/stores/cartStore'
import type { ApiError, Order } from '@/types/api'

const addressSchema = z.object({
  full_name: z.string().trim().min(2, 'Required'),
  phone: z.string().trim().min(6, 'Enter a valid phone number'),
  line1: z.string().trim().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().trim().min(2, 'Required'),
  state: z.string().optional(),
  postal_code: z.string().trim().min(3, 'Required'),
  country_code: z.string().trim().length(2, 'Use a 2-letter code, e.g. US'),
  save: z.boolean().optional(),
  notes: z.string().max(500).optional(),
})
type AddressForm = z.infer<typeof addressSchema>

export default function CheckoutPage() {
  useDocumentTitle('Checkout')
  const { items, couponCode, setCoupon, clear } = useCartStore()
  const quote = useCartQuote()
  const { data: addresses } = useAddresses()
  const checkout = useCheckout()
  const [addressId, setAddressId] = useState<number | 'new'>('new')
  const [couponInput, setCouponInput] = useState(couponCode ?? '')
  const [payment, setPayment] = useState<{ order: Order; clientSecret: string } | null>(null)

  const { register, handleSubmit, setError, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country_code: 'US', save: true },
  })

  useEffect(() => {
    const preferred = addresses?.find((a) => a.is_default) ?? addresses?.[0]
    if (preferred?.id) setAddressId(preferred.id)
  }, [addresses])

  // A coupon rejected by the server is removed so the rest of the quote still loads.
  const quoteError = quote.error as unknown as ApiError | null
  useEffect(() => {
    if (quoteError?.code === 'invalid_coupon' && couponCode) {
      toast.error(quoteError.message)
      setCoupon(null)
    }
  }, [quoteError, couponCode, setCoupon])

  if (payment) {
    return (
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_400px]">
        <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={base} className="card p-6 sm:p-8">
          <p className="eyebrow mb-2">Step 2 of 2</p>
          <h1 className="mb-2 text-3xl">Payment</h1>
          <p className="mb-8 text-sm text-muted">Order <span className="font-medium text-fg">{payment.order.number}</span> is reserved for 60 minutes.</p>
          <PaymentStep order={payment.order} clientSecret={payment.clientSecret} />
        </motion.section>
        <aside className="card h-fit p-6">
          <OrderSummary
            lines={(payment.order.items ?? []).map((i) => ({ key: i.id, name: i.product_name, variant: i.variant_label, image: i.image_url, quantity: i.quantity, total: i.line_total }))}
            totals={{ subtotal: payment.order.subtotal, discount: payment.order.discount_total, shipping: payment.order.shipping_total, tax: payment.order.tax_total, total: payment.order.total, currency: payment.order.currency, couponCode: payment.order.coupon_code }}
          />
        </aside>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-20">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Your cart is empty"
          action={<Link to="/products" className="gold-gradient inline-flex h-11 items-center rounded-full px-6 font-semibold text-on-gold">Continue shopping</Link>}
        />
      </div>
    )
  }

  const placeOrder = (form: AddressForm) => {
    const { notes, save, ...address } = form
    checkout.mutate(
      {
        items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        coupon_code: couponCode ?? undefined,
        notes: notes || undefined,
        ...(addressId === 'new' ? { shipping_address: { ...address, save } } : { address_id: addressId }),
      },
      {
        onSuccess: ({ order, client_secret }) => {
          clear() // stock is reserved server-side now
          setPayment({ order, clientSecret: client_secret })
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        onError: (e) => {
          const err = e as unknown as ApiError
          applyFieldErrors(err, (name, error) => setError(name.replace('shipping_address.', '') as keyof AddressForm, error))
          toast.error(err.message)
        },
      },
    )
  }

  const submit = addressId === 'new' ? handleSubmit(placeOrder) : (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault()
    placeOrder({} as AddressForm)
  }

  return (
    <div className="container-x py-10">
      <p className="eyebrow mb-2">Step 1 of 2</p>
      <h1 className="mb-8 text-4xl">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <form id="checkout-form" onSubmit={submit} className="space-y-8" noValidate>
          <section className="card p-6 sm:p-8">
            <h2 className="mb-6 font-sans text-lg font-semibold">Shipping address</h2>

            {addresses && addresses.length > 0 && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`cursor-pointer rounded-xl border p-4 text-sm transition-colors duration-200 ${addressId === a.id ? 'border-gold bg-gold/5' : 'border-line hover:border-muted'}`}>
                    <input type="radio" name="address" className="sr-only" checked={addressId === a.id} onChange={() => setAddressId(a.id!)} />
                    <p className="font-medium">{a.label ?? 'Address'} · {a.full_name}</p>
                    <p className="text-muted">{a.line1}, {a.city} {a.postal_code}, {a.country_code}</p>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-4 text-sm transition-colors duration-200 ${addressId === 'new' ? 'border-gold text-gold' : 'border-line text-muted'}`}>
                  <input type="radio" name="address" className="sr-only" checked={addressId === 'new'} onChange={() => setAddressId('new')} />
                  + Use a new address
                </label>
              </div>
            )}

            <AnimatePresence initial={false}>
              {addressId === 'new' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={base} className="overflow-hidden">
                  <div className="grid gap-4 p-0.5 sm:grid-cols-2">
                    <Input label="Full name" autoComplete="name" {...register('full_name')} error={errors.full_name?.message} />
                    <Input label="Phone" type="tel" autoComplete="tel" {...register('phone')} error={errors.phone?.message} />
                    <Input label="Address" autoComplete="address-line1" wrapperClassName="sm:col-span-2" {...register('line1')} error={errors.line1?.message} />
                    <Input label="Apartment, suite (optional)" autoComplete="address-line2" wrapperClassName="sm:col-span-2" {...register('line2')} />
                    <Input label="City" autoComplete="address-level2" {...register('city')} error={errors.city?.message} />
                    <Input label="State / Region" autoComplete="address-level1" {...register('state')} />
                    <Input label="Postal code" autoComplete="postal-code" {...register('postal_code')} error={errors.postal_code?.message} />
                    <Input label="Country code" autoComplete="country" maxLength={2} className="uppercase" {...register('country_code')} error={errors.country_code?.message} />
                    <Checkbox label="Save this address to my account" className="sm:col-span-2" {...register('save')} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="mb-4 font-sans text-lg font-semibold">Order notes</h2>
            <Textarea placeholder="Gift message, delivery instructions… (optional)" {...register('notes')} />
          </section>
        </form>

        <aside className="card h-fit space-y-6 p-6 lg:sticky lg:top-28">
          <h2 className="font-sans text-lg font-semibold">Order summary</h2>

          {quote.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : quote.data ? (
            <OrderSummary
              lines={quote.data.items.map((i) => ({ key: i.variant_id, name: i.name, variant: i.variant_label, image: i.image_url, quantity: i.quantity, total: i.line_total }))}
              totals={{ ...quote.data, couponCode: quote.data.coupon?.code }}
            />
          ) : quoteError && quoteError.code !== 'invalid_coupon' ? (
            <p className="text-sm text-danger" role="alert">{quoteError.message} <Link to="/products" className="underline">Update your cart</Link></p>
          ) : null}

          <div>
            {couponCode ? (
              <div className="flex items-center justify-between rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold">
                <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {couponCode} applied</span>
                <button onClick={() => { setCoupon(null); setCouponInput('') }} className="cursor-pointer" aria-label="Remove coupon"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase())
                }}
                className="flex gap-2"
              >
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" className="field uppercase" aria-label="Coupon code" />
                <Button type="submit" variant="outline" size="md">Apply</Button>
              </form>
            )}
            <p className="mt-2 text-xs text-muted">Try WELCOME10, GOLD20 or SAVE15</p>
          </div>

          <Button type="submit" form="checkout-form" size="lg" className="w-full" loading={checkout.isPending} disabled={!quote.data}>
            <CreditCard className="h-4 w-4" /> Continue to payment
          </Button>
        </aside>
      </div>
    </div>
  )
}
