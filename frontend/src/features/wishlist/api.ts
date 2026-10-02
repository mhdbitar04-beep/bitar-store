import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Product } from '@/types/api'

export function useWishlist() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['wishlist'],
    enabled: !!token,
    queryFn: async () => (await api.get<{ data: Product[] }>('/wishlist')).data.data,
  })
}

export function useToggleWishlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, add }: { productId: number; add: boolean }) =>
      add ? api.post(`/wishlist/${productId}`) : api.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
