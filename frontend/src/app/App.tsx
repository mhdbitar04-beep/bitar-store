import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { useUiStore } from '@/stores/uiStore'
import { router } from './router'

export function App() {
  const theme = useUiStore((s) => s.theme)

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" makes every Framer Motion animation honour prefers-reduced-motion. */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <Toaster
          theme={theme}
          position="top-center"
          richColors={false}
          closeButton
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--fg)',
              border: '1px solid color-mix(in oklab, var(--gold) 40%, transparent)',
            },
            actionButtonStyle: { background: 'var(--gold)', color: 'var(--on-gold)', fontWeight: 600 },
          }}
        />
      </MotionConfig>
    </QueryClientProvider>
  )
}
