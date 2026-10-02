import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, LayoutDashboard, Menu, Package, ShoppingCart, Tags, TicketPercent, X } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useOutlet } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { PageLoader } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { base, pageTransition } from '@/lib/motion'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from './ThemeToggle'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
]

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1" aria-label="Admin">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200',
              isActive ? 'text-gold' : 'text-muted hover:bg-surface-2 hover:text-fg',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-gold/10" transition={base} />}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const outlet = useOutlet()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface p-5 lg:flex">
        <Logo className="mb-10" />
        <SideNav />
        <Link to="/" className="mt-auto flex items-center gap-2 px-4 text-sm text-muted hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={base} className="fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-surface p-5 lg:hidden">
              <Logo className="mb-10" />
              <SideNav onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-8">
          <button className="cursor-pointer rounded-full p-2 hover:bg-surface-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <p className="eyebrow">Admin</p>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-sm text-muted sm:block">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} variants={pageTransition} initial="initial" animate="enter" exit="exit">
              <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
