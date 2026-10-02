import { motion } from 'framer-motion'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { PageLoader } from '@/components/ui/Spinner'
import { useOrder } from '@/features/orders/api'
import { formatMoney } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function CheckoutSuccessPage() {
  useDocumentTitle('Order confirmation')
  const [params] = useSearchParams()
  const number = params.get('order') ?? undefined
  const redirectStatus = params.get('redirect_status') // set by Stripe after 3DS / redirects
  const { data: order, isLoading } = useOrder(number, { poll: true })

  if (isLoading || !order) return <PageLoader />

  const paid = order.status !== 'pending' && order.status !== 'cancelled'
  const failed = redirectStatus === 'failed' || order.status === 'cancelled'

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-16">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="card relative w-full max-w-lg overflow-hidden p-10 text-center">
        <div className="gold-gradient absolute inset-x-0 top-0 h-1" />
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }} className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
          {failed ? <XCircle className="h-10 w-10 text-danger" /> : paid ? <CheckCircle2 className="h-10 w-10 text-gold" /> : <Clock className="h-10 w-10 animate-pulse text-gold" />}
        </motion.div>
        <h1 className="text-4xl">{failed ? 'Payment not completed' : paid ? 'Thank you!' : 'Confirming payment…'}</h1>
        <p className="mt-3 text-muted">
          {failed
            ? 'Your payment did not go through. You can retry from your order page.'
            : paid
              ? `Your order ${order.number} is confirmed. A receipt is on its way.`
              : 'This usually takes a few seconds — we are waiting for Stripe to confirm.'}
        </p>
        <p className="mt-6 font-display text-3xl text-gold">{formatMoney(order.total, order.currency)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/account/orders/${order.number}`} className="gold-gradient inline-flex h-11 items-center rounded-full px-6 font-semibold text-on-gold">View order</Link>
          <Link to="/products" className="gold-border inline-flex h-11 items-center rounded-full px-6 font-semibold text-gold">Keep shopping</Link>
        </div>
      </motion.div>
    </div>
  )
}
