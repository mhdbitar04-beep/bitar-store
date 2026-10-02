import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category, Paginated, Product, Review, ReviewsResponse, StoreConfig } from '@/types/api'

export interface ProductFilters {
  search?: string
  category?: string
  min_price?: number
  max_price?: number
  rating?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'name'
  in_stock?: boolean
  featured?: boolean
  page?: number
  per_page?: number
}

const clean = (f: ProductFilters) =>
  Object.fromEntries(
    Object.entries(f)
      .filter(([, v]) => v !== undefined && v !== '' && v !== false)
      .map(([k, v]) => [k, v === true ? 1 : v]),
  )

export const productKeys = {
  all: ['products'] as const,
  list: (f: ProductFilters) => ['products', 'list', clean(f)] as const,
  detail: (slug: string) => ['products', 'detail', slug] as const,
  reviews: (slug: string, page: number) => ['products', 'reviews', slug, page] as const,
}

export function useStoreConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => (await api.get<{ data: StoreConfig }>('/config')).data.data,
    staleTime: Infinity,
  })
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async ({ signal }) => (await api.get<Paginated<Product>>('/products', { params: clean(filters), signal })).data,
    placeholderData: keepPreviousData,
  })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(slug ?? ''),
    enabled: !!slug,
    queryFn: async () => (await api.get<{ data: Product }>(`/products/${slug}`)).data.data,
  })
}

export function useRelatedProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ['products', 'related', slug],
    enabled: !!slug,
    queryFn: async () => (await api.get<{ data: Product[] }>(`/products/${slug}/related`)).data.data,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
    staleTime: 10 * 60_000,
  })
}

export function useReviews(slug: string | undefined, page = 1) {
  return useQuery({
    queryKey: productKeys.reviews(slug ?? '', page),
    enabled: !!slug,
    queryFn: async () => (await api.get<ReviewsResponse>(`/products/${slug}/reviews`, { params: { page } })).data,
    placeholderData: keepPreviousData,
  })
}

export function useCreateReview(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { rating: number; title?: string; body: string }) =>
      (await api.post<{ data: Review }>(`/products/${slug}/reviews`, input)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', 'reviews', slug] })
      qc.invalidateQueries({ queryKey: productKeys.detail(slug) })
    },
  })
}
