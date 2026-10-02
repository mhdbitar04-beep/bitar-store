import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useSimulatePayment } from '@/features/orders/api'
import { useStoreConfig } from '@/features/products/api'
import { formatMoney } from '@/lib/money'
import { useUiStore } from '@/stores/uiStore'
import type { Order } from '@/types/api'

const stripeCache = new Map<string, Promise<Stripe | null>>()
const getStripe = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key))
  return stripeCache.get(key)!
}

export function PaymentStep({ order, clientSecret }: { order: Order; clientSecret: string }) {
  const { data: config } = useStoreConfig()
  const theme = useUiStore((s) => s.theme)

  if (!config) return null

  if (config.payment_gateway === 'fake' || !config.stripe_key) {
    return <FakePayment order={order} />
  }

  const dark = theme === 'dark'

  return (
    <Elements
      stripe={getStripe(config.stripe_key)}
      options={{
        clientSecret,
        appearance: {
          theme: dark ? 'night' : 'stripe',
          variables: {
            colorPrimary: dark ? '#D4AF37' : '#A8841F',
            colorBackground: dark ? '#1A1917' : '#FFFFFF',
            colorText: dark ? '#F5EFE0' : '#141210',
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        },
      }}
    >
      <StripeForm order={order} />
    </Elements>
  )
}

function StripeForm({ order }: { order: Order }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success?order=${order.number}` },
    })

    // Only reached on immediate errors (card declined, validation…); success redirects.
    if (error) toast.error(error.message ?? 'Payment failed')
    setSubmitting(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!stripe}>
        <Lock className="h-4 w-4" /> Pay {formatMoney(order.total, order.currency)}
      </Button>
      <p className="text-center text-xs text-muted">Test card: 4242 4242 4242 4242 · any future date · any CVC</p>
    </form>
  )
}

function FakePayment({ order }: { order: Order }) {
  const simulate = useSimulatePayment()
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-gold/50 bg-gold/5 p-4 text-sm text-muted">
        Offline demo mode (<code>PAYMENT_GATEWAY=fake</code>). Set Stripe test keys in the API <code>.env</code> to use real Stripe Elements.
      </div>
      <Button
        size="lg"
        className="w-full"
        loading={simulate.isPending}
        onClick={() =>
          simulate.mutate(order.number, {
            onSuccess: () => navigate(`/checkout/success?order=${order.number}`),
            onError: () => toast.error('Simulation failed'),
          })
        }
      >
        <Lock className="h-4 w-4" /> Simulate payment of {formatMoney(order.total, order.currency)}
      </Button>
    </div>
  )
}
