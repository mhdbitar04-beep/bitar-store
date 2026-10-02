import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types/api'
import type { ChangePasswordInput, LoginInput, ProfileInput, RegisterInput } from './schemas'

type Session = { data: { user: User; token: string } }

export function useMe() {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
    queryKey: ['me', token],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await api.get<{ data: User }>('/auth/me')
      setUser(data.data)
      return data.data
    },
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LoginInput) => (await api.post<Session>('/auth/login', input)).data.data,
    onSuccess: ({ token, user }) => {
      setSession(token, user)
      qc.invalidateQueries()
    },
  })
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: async (input: RegisterInput) => (await api.post<Session>('/auth/register', input)).data.data,
    onSuccess: ({ token, user }) => setSession(token, user),
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout').catch(() => undefined)
    },
    onSettled: () => {
      clear()
      qc.clear()
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => (await api.post<{ message: string }>('/auth/forgot-password', { email })).data,
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { email: string; token: string; password: string; password_confirmation: string }) =>
      (await api.post<{ message: string }>('/auth/reset-password', input)).data,
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: async (input: ProfileInput) => (await api.put<{ data: User }>('/account/profile', input)).data.data,
    onSuccess: setUser,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => (await api.put('/account/password', input)).data,
  })
}
