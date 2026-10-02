import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useRegister } from '@/features/auth/api'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'
import { applyFieldErrors } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError } from '@/types/api'
import { AuthCard } from './AuthLayout'

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const registerUser = useRegister()
  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = (input: RegisterInput) =>
    registerUser.mutate(input, {
      onSuccess: () => {
        toast.success('Account created — welcome to BITAR STORE')
        navigate('/', { replace: true })
      },
      onError: (e) => applyFieldErrors<keyof RegisterInput>(e as unknown as ApiError, setError),
    })

  return (
    <AuthCard title="Create account" subtitle="Save your wishlist, track orders and check out faster." footer={<>Already a member? <Link to="/login" className="text-gold hover:underline">Sign in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full name" autoComplete="name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" autoComplete="new-password" hint="8+ characters with letters and numbers" {...register('password')} error={errors.password?.message} />
        <Input label="Confirm password" type="password" autoComplete="new-password" {...register('password_confirmation')} error={errors.password_confirmation?.message} />
        <Button type="submit" size="lg" className="w-full" loading={registerUser.isPending}>Create account</Button>
      </form>
    </AuthCard>
  )
}
