import type { Transition, Variants } from 'framer-motion'

/** Shared motion tokens — every UI animation stays between 200 and 400 ms. */
export const ease = [0.22, 1, 0.36, 1] as const

export const fast: Transition = { duration: 0.2, ease }
export const base: Transition = { duration: 0.3, ease }
export const slow: Transition = { duration: 0.4, ease }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: base },
}

export const stagger = (step = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step } },
})

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: base },
  exit: { opacity: 0, y: -8, transition: fast },
}
