import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Attribute, Category, Coupon, Dashboard, Order, OrderStatus, Paginated, Product, ProductImage } from '@/types/api'

export function useDashboard(days: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', days],
    queryFn: async () => (await api.get<{ data: Dashboard }>('/admin/dashboard', { params: { days } })).data.data,
    placeholderData: keepPreviousData,
  })
}

/* ---------------- Products ---------------- */

export interface AdminProductInput {
  category_id: number
  name: string
  slug?: string
  short_description?: string | null
  description?: string | null
  base_price: number
  compare_at_price?: number | null
  is_active: boolean
  is_featured: boolean
  stock?: number
  variants?: { id?: number; sku?: string; price?: number | null; stock: number; is_active?: boolean; attribute_value_ids: number[] }[]
}

export function useAdminProducts(params: { page: number; search?: string; trashed?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/admin/products', { params: { ...params, trashed: params.trashed ? 1 : undefined } })).data,
    placeholderData: keepPreviousData,
  })
}

export function useAdminProduct(id: number | undefined) {
  return useQuery({
    queryKey: ['admin', 'products', 'detail', id],
    enabled: !!id,
    queryFn: async () => (await api.get<{ data: Product }>(`/admin/products/${id}`)).data.data,
  })
}

export function useSaveProduct(id?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminProductInput) =>
      id
        ? (await api.put<{ data: Product }>(`/admin/products/${id}`, input)).data.data
        : (await api.post<{ data: Product }>('/admin/products', input)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUploadImages(productId: number | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, id }: { files: File[]; id?: number }) => {
      const form = new FormData()
      files.forEach((f) => form.append('images[]', f))
      return (await api.post<{ data: ProductImage[] }>(`/admin/products/${id ?? productId}/images`, form)).data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useDeleteImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: number) => api.delete(`/admin/product-images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useMakePrimaryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (imageId: number) => api.patch(`/admin/product-images/${imageId}/primary`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useAttributes() {
  return useQuery({
    queryKey: ['admin', 'attributes'],
    queryFn: async () => (await api.get<{ data: Attribute[] }>('/admin/attributes')).data.data,
    staleTime: Infinity,
  })
}

/* ---------------- Categories ---------------- */

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/admin/categories')).data.data,
  })
}

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: Partial<Category> }) =>
      id ? api.put(`/admin/categories/${id}`, input) : api.post('/admin/categories', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/* ---------------- Coupons ---------------- */

export function useAdminCoupons(page = 1) {
  return useQuery({
    queryKey: ['admin', 'coupons', page],
    queryFn: async () => (await api.get<Paginated<Coupon>>('/admin/coupons', { params: { page } })).data,
    placeholderData: keepPreviousData,
  })
}

export function useSaveCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: Partial<Coupon> }) =>
      id ? api.put(`/admin/coupons/${id}`, input) : api.post('/admin/coupons', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

/* ---------------- Orders ---------------- */

export function useAdminOrders(params: { page: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => (await api.get<Paginated<Order>>('/admin/orders', { params })).data,
    placeholderData: keepPreviousData,
  })
}

export function useAdminOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['admin', 'orders', 'detail', id],
    enabled: !!id,
    queryFn: async () => (await api.get<{ data: Order }>(`/admin/orders/${id}`)).data.data,
  })
}

export function useUpdateOrderStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { status: OrderStatus; note?: string }) =>
      (await api.patch<{ data: Order }>(`/admin/orders/${id}/status`, input)).data.data,
    onSuccess: (order) => {
      qc.setQueryData(['admin', 'orders', 'detail', id], order)
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}
