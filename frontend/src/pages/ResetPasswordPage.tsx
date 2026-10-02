import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useResetPassword } from '@/features/auth/api'
import { resetSchema, type ResetInput } from '@/features/auth/schemas'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import type { ApiError } from '@/types/api'
import { AuthCard } from './AuthLayout'

export default function ResetPasswordPage() {
  useDocumentTitle('Choose a new password')
  const [params] = useSearchParams()
  const reset = useResetPassword()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<ResetInput>({ resolver: zodResolver(resetSchema) })

  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const onSubmit = (input: ResetInput) =>
    reset.mutate(
      { ...input, token, email },
      {
        onSuccess: (res) => {
          toast.success(res.message)
          navigate('/login', { replace: true })
        },
        onError: (e) => toast.error((e as unknown as ApiError).errors?.email?.[0] ?? (e as unknown as ApiError).message),
      },
    )

  return (
    <AuthCard title="New password" subtitle={email ? `For ${email}` : undefined}>
      {!token ? (
        <p className="text-sm text-danger">This reset link is invalid. Please request a new one.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="New password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          <Input label="Confirm password" type="password" autoComplete="new-password" {...register('password_confirmation')} error={errors.password_confirmation?.message} />
          <Button type="submit" size="lg" className="w-full" loading={reset.isPending}>Reset password</Button>
        </form>
      )}
    </AuthCard>
  )
}
