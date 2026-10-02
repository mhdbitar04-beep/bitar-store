import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { useUiStore, type FlyingItem } from '@/stores/uiStore'

function Flyer({ item }: { item: FlyingItem }) {
  const landed = useUiStore((s) => s.landed)
  const target = document.getElementById('cart-button')?.getBoundingClientRect()

  useEffect(() => {
    if (!target) landed(item.id)
  }, [target, item.id, landed])

  if (!target) return null

  const size = Math.min(item.from.width, 120)
  const startX = item.from.x + item.from.width / 2 - size / 2
  const startY = item.from.y + item.from.height / 2 - size / 2
  const endX = target.left + target.width / 2 - 12
  const endY = target.top + target.height / 2 - 12

  return (
    <motion.img
      src={item.src}
      alt=""
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] rounded-xl object-cover shadow-card ring-2 ring-gold"
      style={{ width: size, height: size }}
      initial={{ x: startX, y: startY, scale: 1, opacity: 1 }}
      animate={{
        x: [startX, (startX + endX) / 2, endX],
        y: [startY, Math.min(startY, endY) - 80, endY],
        scale: [1, 0.6, 0.2],
        opacity: [1, 1, 0.4],
      }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      onAnimationComplete={() => landed(item.id)}
    />
  )
}

/** Renders product thumbnails flying from the "Add to cart" button into the header cart. */
export function FlyToCartLayer() {
  const flying = useUiStore((s) => s.flying)
  const landed = useUiStore((s) => s.landed)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) flying.forEach((f) => landed(f.id))
  }, [reduce, flying, landed])

  if (reduce) return null

  return (
    <AnimatePresence>
      {flying.map((item) => (
        <Flyer key={item.id} item={item} />
      ))}
    </AnimatePresence>
  )
}
