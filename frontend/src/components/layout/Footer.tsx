import { Link } from 'react-router'
import { Logo } from '@/components/ui/Logo'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">Curated electronics, fashion, beauty and home — delivered in our signature black & gold.</p>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Shop</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-gold" to="/products?category=electronics">Electronics</Link></li>
            <li><Link className="hover:text-gold" to="/products?category=fashion">Fashion</Link></li>
            <li><Link className="hover:text-gold" to="/products?category=beauty">Beauty</Link></li>
            <li><Link className="hover:text-gold" to="/products?category=home-living">Home & Living</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Account</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-gold" to="/account">Profile</Link></li>
            <li><Link className="hover:text-gold" to="/account/orders">Orders</Link></li>
            <li><Link className="hover:text-gold" to="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Service</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>Free shipping over $150</li>
            <li>30-day free returns</li>
            <li>Secure payments by Stripe</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-muted">© {new Date().getFullYear()} BITAR STORE. All rights reserved.</div>
    </footer>
  )
}
