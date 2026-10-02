import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { Img } from '@/components/ui/Img'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCategories } from '@/features/products/api'
import { fadeUp, stagger } from '@/lib/motion'

export function CategoryShowcase() {
  const { data, isLoading } = useCategories()

  return (
    <section className="container-x py-24" aria-labelledby="categories-title">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Explore</p>
          <h2 id="categories-title" className="text-4xl sm:text-5xl">Shop by category</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      ) : (
        <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {data?.map((cat) => (
            <motion.div key={cat.id} variants={fadeUp}>
              <Link to={`/products?category=${cat.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-line">
                <Img src={cat.image_url ?? undefined} alt={cat.name} width={600} height={800} className="h-full w-full object-cover grayscale-[40%] transition-all duration-400 group-hover:scale-105 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <div>
                    <h3 className="text-2xl">{cat.name}</h3>
                    <p className="text-xs text-white/70">{cat.children?.map((c) => c.name).join(' · ')}</p>
                  </div>
                  <span className="gold-gradient flex h-10 w-10 items-center justify-center rounded-full text-on-gold transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  )
}
