import { useEffect } from 'react'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · BITAR STORE` : 'BITAR STORE — Curated luxury in black & gold'
  }, [title])
}
