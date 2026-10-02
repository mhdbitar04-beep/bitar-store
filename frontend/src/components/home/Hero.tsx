import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-driven hero (GSAP ScrollTrigger is used ONLY here).
 * The section is pinned while the headline lifts away, the gold rings rotate/scale
 * and a second message is revealed. Disabled entirely for prefers-reduced-motion.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Intro
        gsap.from('.hero-line', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' })
        gsap.from('.hero-fade', { opacity: 0, y: 16, duration: 0.6, delay: 0.35, stagger: 0.08, ease: 'power2.out' })
        gsap.from('.hero-rings', { scale: 0.85, opacity: 0, duration: 1.2, ease: 'power3.out' })

        // Scroll story
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=110%',
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        })

        tl.to('.hero-copy', { yPercent: -35, opacity: 0, ease: 'none' }, 0)
          .to('.hero-rings', { rotate: 120, scale: 1.35, ease: 'none' }, 0)
          .to('.hero-orb', { scale: 1.6, opacity: 0.9, ease: 'none' }, 0)
          .fromTo('.hero-reveal', { opacity: 0, y: 80 }, { opacity: 1, y: 0, ease: 'power1.out' }, 0.35)
          .to('.hero-scroll', { opacity: 0, ease: 'none' }, 0)
      })
    }, root)

    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [])

  return (
    <section ref={root} className="relative -mt-16 flex h-dvh min-h-[600px] items-center justify-center overflow-hidden lg:-mt-20" aria-label="Welcome">
      <div className="hero-glow absolute inset-0" aria-hidden />

      {/* Decorative gold rings */}
      <svg className="hero-rings absolute h-[140vmin] w-[140vmin] text-gold opacity-60" viewBox="0 0 400 400" aria-hidden>
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--gold-soft)" />
            <stop offset="0.5" stopColor="var(--gold)" stopOpacity="0.2" />
            <stop offset="1" stopColor="var(--gold-strong)" />
          </linearGradient>
        </defs>
        {[190, 150, 110].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="url(#ring)" strokeWidth={i === 1 ? 1.2 : 0.6} strokeDasharray={i === 0 ? '2 6' : i === 2 ? '40 12' : undefined} />
        ))}
        <circle cx="200" cy="10" r="4" fill="var(--gold)" />
        <circle cx="390" cy="200" r="2.5" fill="var(--gold-soft)" />
      </svg>
      <div className="hero-orb gold-gradient absolute h-40 w-40 rounded-full opacity-40 blur-3xl" aria-hidden />

      <div className="hero-copy container-x relative z-10 text-center">
        <p className="hero-fade eyebrow mb-6">Est. 2026 · Curated Luxury</p>
        <h1 className="text-5xl leading-[1.05] sm:text-7xl lg:text-8xl">
          <span className="block overflow-hidden"><span className="hero-line block">Timeless pieces.</span></span>
          <span className="block overflow-hidden"><span className="hero-line gold-text block">Delivered in gold.</span></span>
        </h1>
        <p className="hero-fade mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg">
          Flagship tech, fine fashion, rare fragrances and statement décor — hand-picked and shipped in our signature black box.
        </p>
        <div className="hero-fade mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/products" className="gold-gradient inline-flex h-13 items-center gap-2 rounded-full px-8 font-semibold text-on-gold transition-transform duration-200 hover:scale-[1.03]">
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/products?sort=popular" className="gold-border inline-flex h-13 items-center rounded-full px-8 font-semibold text-gold transition-colors duration-200 hover:bg-gold/10">
            Best sellers
          </Link>
        </div>
      </div>

      <div className="hero-reveal pointer-events-none absolute inset-x-0 z-10 px-6 text-center opacity-0">
        <p className="eyebrow mb-4">Four worlds, one standard</p>
        <p className="mx-auto max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
          Electronics · Fashion · Beauty · <span className="gold-text">Home</span>
        </p>
      </div>

      <div className="hero-scroll absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.3em] text-muted uppercase">
        Scroll
        <ArrowDown className="h-4 w-4 animate-bounce text-gold" />
      </div>
    </section>
  )
}
