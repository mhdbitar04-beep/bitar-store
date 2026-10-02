import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

export interface FlyingItem {
  id: number
  src: string
  from: { x: number; y: number; width: number; height: number }
}

interface UiState {
  theme: Theme
  toggleTheme: () => void
  mobileMenuOpen: boolean
  setMobileMenu: (open: boolean) => void
  flying: FlyingItem[]
  flyToCart: (src: string, rect: DOMRect) => void
  landed: (id: number) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const theme: Theme = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('dark', theme === 'dark')
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A0A0A' : '#FAF7F0')
        set({ theme })
      },
      mobileMenuOpen: false,
      setMobileMenu: (mobileMenuOpen) => set({ mobileMenuOpen }),
      flying: [],
      flyToCart: (src, rect) =>
        set((s) => ({
          flying: [...s.flying, { id: Date.now() + Math.random(), src, from: { x: rect.left, y: rect.top, width: rect.width, height: rect.height } }],
        })),
      landed: (id) => set((s) => ({ flying: s.flying.filter((f) => f.id !== id) })),
    }),
    { name: 'bitar-ui', partialize: (s) => ({ theme: s.theme }) },
  ),
)
