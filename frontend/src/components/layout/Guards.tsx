import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return children
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  // The API enforces the role too — this only avoids showing a broken UI.
  if (!user?.is_admin) return <Navigate to="/" replace />
  return children
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/" replace /> : children
}
