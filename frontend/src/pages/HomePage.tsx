import { CategoryShowcase } from '@/components/home/CategoryShowcase'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { Hero } from '@/components/home/Hero'
import { Perks } from '@/components/home/Perks'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export default function HomePage() {
  useDocumentTitle()
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <FeaturedProducts />
      <Perks />
    </>
  )
}
