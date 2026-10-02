import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useLogin } from '@/features/auth/api'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'
import { applyFieldErrors } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError } from '@/types/api'
import { AuthCard } from './AuthLayout'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const login = useLogin()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (input: LoginInput) =>
    login.mutate(input, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome back, ${user.name.split(' ')[0]}`)
        const redirect = params.get('redirect')
        navigate(redirect?.startsWith('/') ? redirect : user.is_admin ? '/admin' : '/', { replace: true })
      },
      onError: (e) => applyFieldErrors<keyof LoginInput>(e as unknown as ApiError, setError),
    })

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your BITAR STORE account." footer={<>New here? <Link to="/register" className="text-gold hover:underline">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-gold hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>Sign in</Button>
        <p className="text-center text-xs text-muted">Demo: customer@bitarstore.test · admin@bitarstore.test — Password123</p>
      </form>
    </AuthCard>
  )
}
