import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp } from '@/lib/motion'

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-x flex min-h-[75vh] items-center justify-center py-12">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card relative w-full max-w-md overflow-hidden p-8 sm:p-10">
        <div className="gold-gradient absolute inset-x-0 top-0 h-1" aria-hidden />
        <h1 className="text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 border-t border-line pt-6 text-center text-sm text-muted">{footer}</div>}
      </motion.div>
    </div>
  )
}
