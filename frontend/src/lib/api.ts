import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { Accept: 'application/json' },
  timeout: 20_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Expired / revoked token: drop the session so the UI returns to guest mode.
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().clear()
    }
    return Promise.reject(normalizeError(error))
  },
)

/** Every error in the app has the backend's { message, code, errors? } shape. */
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      return { ...data, status: error.response?.status }
    }
    return {
      message: error.code === 'ECONNABORTED' ? 'The request timed out.' : 'Network error — is the API running?',
      code: 'network_error',
      status: error.response?.status,
    }
  }
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) return error as ApiError
  return { message: 'Something went wrong.', code: 'unknown' }
}

/** Map API validation errors onto react-hook-form fields. */
export function applyFieldErrors<T extends string>(
  error: ApiError,
  setError: (name: T, e: { type: string; message: string }) => void,
) {
  Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
    setError(field as T, { type: 'server', message: messages[0] })
  })
}
