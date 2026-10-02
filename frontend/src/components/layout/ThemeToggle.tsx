import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { fast } from '@/lib/motion'
import { useUiStore } from '@/stores/uiStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore()
  const dark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-colors duration-200 hover:bg-surface-2"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -16, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 16, opacity: 0, rotate: 45 }}
          transition={fast}
        >
          {dark ? <Moon className="h-5 w-5 text-gold" /> : <Sun className="h-5 w-5 text-gold" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
