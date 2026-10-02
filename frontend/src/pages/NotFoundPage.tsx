import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Not found')
  return (
    <div className="container-x py-24">
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title="Page not found"
        description="The page you're looking for has moved or never existed."
        action={<Link to="/" className="gold-gradient inline-flex h-11 items-center rounded-full px-6 font-semibold text-on-gold">Back home</Link>}
      />
    </div>
  )
}
