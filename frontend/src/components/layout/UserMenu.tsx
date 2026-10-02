import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, LogOut, Package, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useLogout } from '@/features/auth/api'
import { fast } from '@/lib/motion'
import { useAuthStore } from '@/stores/authStore'

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const logout = useLogout()
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) {
    return (
      <Link
        to="/login"
        className="gold-border flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/10 sm:px-4"
        aria-label="Sign in"
      >
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    )
  }

  const item = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-surface-2 hover:text-gold'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="gold-border flex h-10 w-10 cursor-pointer items-center justify-center rounded-full font-display text-sm font-bold text-gold"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.name.charAt(0).toUpperCase()}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={fast}
            className="card absolute right-0 z-50 mt-2 w-56 origin-top-right p-2 shadow-card"
            onClick={() => setOpen(false)}
          >
            <div className="border-b border-line px-3 pt-1 pb-3">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <div className="pt-2">
              {user.is_admin && (
                <Link to="/admin" className={item} role="menuitem">
                  <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                </Link>
              )}
              <Link to="/account/orders" className={item} role="menuitem">
                <Package className="h-4 w-4" /> My orders
              </Link>
              <Link to="/account" className={item} role="menuitem">
                <UserIcon className="h-4 w-4" /> Profile
              </Link>
              <button
                role="menuitem"
                className={`${item} w-full cursor-pointer`}
                onClick={() =>
                  logout.mutate(undefined, {
                    onSettled: () => {
                      toast.success('Signed out')
                      navigate('/')
                    },
                  })
                }
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
