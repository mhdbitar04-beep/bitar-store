import { QueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/types/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const status = (error as unknown as ApiError).status ?? 0
        return status >= 500 && count < 2
      },
    },
  },
})
