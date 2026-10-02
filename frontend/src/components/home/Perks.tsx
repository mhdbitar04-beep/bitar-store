import { motion } from 'framer-motion'
import { Gift, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { fadeUp, stagger } from '@/lib/motion'

const perks = [
  { icon: Truck, title: 'Free shipping', text: 'On every order over $150.' },
  { icon: RotateCcw, title: '30-day returns', text: 'Changed your mind? No problem.' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Payments protected by Stripe.' },
  { icon: Gift, title: 'Signature packaging', text: 'Black box, gold ribbon.' },
]

export function Perks() {
  return (
    <section className="container-x py-16">
      <motion.ul variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <motion.li key={title} variants={fadeUp} className="card flex items-start gap-4 p-6 transition-colors duration-300 hover:border-gold/50">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-sans text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
