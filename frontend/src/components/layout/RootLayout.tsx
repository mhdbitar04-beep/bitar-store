import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, useEffect } from 'react'
import { ScrollRestoration, useLocation, useOutlet } from 'react-router'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { FlyToCartLayer } from '@/components/cart/FlyToCartLayer'
import { PageLoader } from '@/components/ui/Spinner'
import { useMe } from '@/features/auth/api'
import { pageTransition } from '@/lib/motion'
import { Footer } from './Footer'
import { Header } from './Header'

export function RootLayout() {
  const location = useLocation()
  const outlet = useOutlet()
  useMe() // refresh the cached user (and drop an expired token) on boot

  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-on-gold">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname} variants={pageTransition} initial="initial" animate="enter" exit="exit">
            <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartDrawer />
      <FlyToCartLayer />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  )
}
