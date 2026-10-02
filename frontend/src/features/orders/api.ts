import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Address, Order, Paginated } from '@/types/api'

export interface CheckoutInput {
  items: { variant_id: number; quantity: number }[]
  coupon_code?: string
  address_id?: number
  shipping_address?: Address & { save?: boolean }
  notes?: string
}

type PaymentSession = { order: Order; client_secret: string }

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: async () => (await api.get<Paginated<Order>>('/orders', { params: { page } })).data,
    placeholderData: keepPreviousData,
  })
}

export function useOrder(number: string | undefined, options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: ['orders', 'detail', number],
    enabled: !!number,
    queryFn: async () => (await api.get<{ data: Order }>(`/orders/${number}`)).data.data,
    // After Stripe redirects back, poll until the webhook marks the order paid.
    refetchInterval: (query) => (options.poll && query.state.data?.status === 'pending' ? 2000 : false),
  })
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get<{ data: Address[] }>('/account/addresses')).data.data,
  })
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (input: CheckoutInput) => (await api.post<{ data: PaymentSession }>('/checkout', input)).data.data,
  })
}

export function usePayOrder() {
  return useMutation({
    mutationFn: async (number: string) => (await api.post<{ data: PaymentSession }>(`/orders/${number}/pay`)).data.data,
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (number: string) => (await api.post<{ data: Order }>(`/orders/${number}/cancel`)).data.data,
    onSuccess: (order) => {
      qc.setQueryData(['orders', 'detail', order.number], order)
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useSimulatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (number: string) => (await api.post<{ data: Order }>(`/orders/${number}/simulate-payment`)).data.data,
    onSuccess: (order) => {
      qc.setQueryData(['orders', 'detail', order.number], order)
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
