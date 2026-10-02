import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useToggleWishlist } from '@/features/wishlist/api'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/authStore'

export function WishlistButton({ productId, initial = false, className }: { productId: number; initial?: boolean; className?: string }) {
  const [active, setActive] = useState(initial)
  const token = useAuthStore((s) => s.token)
  const toggle = useToggleWishlist()
  const navigate = useNavigate()

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) {
      toast.info('Sign in to save items to your wishlist')
      navigate('/login')
      return
    }
    const next = !active
    setActive(next) // optimistic
    toggle.mutate(
      { productId, add: next },
      {
        onSuccess: () => toast.success(next ? 'Added to wishlist' : 'Removed from wishlist'),
        onError: () => {
          setActive(!next)
          toast.error('Could not update wishlist')
        },
      },
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-bg/70 backdrop-blur transition-colors duration-200 hover:border-gold',
        className,
      )}
    >
      <Heart className={cn('h-4.5 w-4.5 transition-colors duration-200', active ? 'fill-gold text-gold' : 'text-fg')} />
    </motion.button>
  )
}
