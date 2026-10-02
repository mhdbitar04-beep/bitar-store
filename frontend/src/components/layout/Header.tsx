import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Menu, Search, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { CartButton } from '@/components/cart/CartButton'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { base } from '@/lib/motion'
import { useUiStore } from '@/stores/uiStore'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

const links = [
  { to: '/products', label: 'Shop' },
  { to: '/products?category=electronics', label: 'Electronics' },
  { to: '/products?category=fashion', label: 'Fashion' },
  { to: '/products?category=beauty', label: 'Beauty' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch] = useState('')
  const { mobileMenuOpen, setMobileMenu } = useUiStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileMenu(false), [location.pathname, location.search, setMobileMenu])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'border-b border-line bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-x flex h-16 items-center gap-4 lg:h-20">
        <button
          className="-ml-2 cursor-pointer rounded-full p-2 hover:bg-surface-2 lg:hidden"
          onClick={() => setMobileMenu(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Logo />

        <nav className="ml-8 hidden items-center gap-7 lg:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className="group relative text-sm font-medium text-muted transition-colors duration-200 hover:text-fg"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="field h-10 rounded-full pl-10"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <ThemeToggle />
          <Link to="/wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2 sm:flex" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <UserMenu />
          <CartButton />
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={base}
            className="overflow-hidden border-t border-line bg-bg lg:hidden"
            aria-label="Mobile"
          >
            <div className="container-x space-y-1 py-4">
              <form onSubmit={submit} className="mb-3" role="search">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="field rounded-full" aria-label="Search products" />
              </form>
              {[...links, { to: '/wishlist', label: 'Wishlist' }].map((l) => (
                <Link key={l.label} to={l.to} className="block rounded-lg px-3 py-3 font-medium hover:bg-surface-2 hover:text-gold">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
