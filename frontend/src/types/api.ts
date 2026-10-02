/** Mirrors the Laravel API Resources. All money values are integer cents. */

export interface Paginated<T> {
  data: T[]
  links: { first: string | null; last: string | null; prev: string | null; next: string | null }
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null }
}

export interface ApiError {
  message: string
  code: string
  errors?: Record<string, string[]>
  status?: number
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: 'admin' | 'customer'
  is_admin: boolean
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  products_count?: number
  children?: Category[]
}

export interface ProductImage {
  id: number
  url: string
  alt: string | null
  is_primary: boolean
  sort_order: number
}

export interface AttributeValue {
  id: number
  value: string
  color_hex: string | null
  attribute_id: number
  attribute?: { id: number; name: string; slug: string; type: 'select' | 'color' }
}

export interface Attribute {
  id: number
  name: string
  slug: string
  type: 'select' | 'color'
  values: AttributeValue[]
}

export interface Variant {
  id: number
  sku: string
  price: number
  price_override: number | null
  stock: number
  in_stock: boolean
  is_default: boolean
  is_active: boolean
  label?: string | null
  attribute_values?: AttributeValue[]
}

export interface ProductOption {
  attribute: { id: number; name: string; slug: string; type: 'select' | 'color' }
  values: { id: number; value: string; color_hex: string | null }[]
}

export interface Product {
  id: number
  name: string
  slug: string
  short_description: string | null
  description: string | null
  base_price: number
  compare_at_price: number | null
  price_min: number
  price_max: number
  total_stock: number | null
  in_stock: boolean | null
  rating_avg: number
  reviews_count: number
  sold_count: number
  is_featured: boolean
  is_active: boolean
  is_wishlisted?: boolean
  category?: Category
  primary_image?: ProductImage | null
  images?: ProductImage[]
  variants?: Variant[]
  options?: ProductOption[]
  created_at: string
  deleted_at?: string
}

export interface Review {
  id: number
  rating: number
  title: string | null
  body: string
  is_verified_purchase: boolean
  user?: { id: number; name: string }
  created_at: string
}

export interface ReviewsResponse extends Paginated<Review> {
  summary: { average: number; count: number; distribution: Record<string, number> }
}

export interface Address {
  id?: number
  label?: string | null
  full_name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postal_code: string
  country_code: string
  is_default?: boolean
}

export interface QuoteItem {
  variant_id: number
  product_id: number
  product_slug: string
  name: string
  variant_label: string | null
  sku: string
  image_url: string | null
  unit_price: number
  quantity: number
  line_total: number
  stock: number
}

export interface CartQuote {
  items: QuoteItem[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  currency: string
  coupon: { code: string; type: 'percent' | 'fixed'; value: number } | null
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface OrderItem {
  id: number
  product_id: number | null
  product_variant_id: number | null
  product_slug?: string | null
  product_name: string
  variant_label: string | null
  sku: string
  image_url: string | null
  unit_price: number
  quantity: number
  line_total: number
}

export interface Order {
  id: number
  number: string
  status: OrderStatus
  status_label: string
  allowed_transitions: OrderStatus[]
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  total: number
  currency: string
  coupon_code: string | null
  shipping_address: Address
  notes: string | null
  items_count?: number
  items?: OrderItem[]
  history?: { id: number; from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; created_at: string }[]
  payment?: { provider: string; status: 'pending' | 'succeeded' | 'failed' | 'refunded' } | null
  customer?: User
  can_cancel: boolean
  can_pay: boolean
  paid_at: string | null
  created_at: string
}

export interface Coupon {
  id: number
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  per_user_limit: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface StoreConfig {
  currency: string
  payment_gateway: 'stripe' | 'fake'
  stripe_key: string | null
  shipping: { flat: number; free_over: number }
  tax_rate: number
}

export interface Dashboard {
  range_days: number
  kpis: {
    revenue: number
    orders: number
    average_order_value: number
    new_customers: number
    revenue_change: number | null
    orders_change: number | null
    pending_orders: number
    low_stock_variants: number
  }
  sales_over_time: { date: string; revenue: number; orders: number }[]
  top_products: { product_id: number | null; name: string; quantity: number; revenue: number }[]
  orders_by_status: Record<OrderStatus, number>
}
