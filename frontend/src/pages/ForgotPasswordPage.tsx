import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useForgotPassword } from '@/features/auth/api'
import { forgotSchema, type ForgotInput } from '@/features/auth/schemas'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { AuthCard } from './AuthLayout'

export default function ForgotPasswordPage() {
  useDocumentTitle('Reset password')
  const forgot = useForgotPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) })

  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a secure link to reset it." footer={<Link to="/login" className="text-gold hover:underline">Back to sign in</Link>}>
      {forgot.isSuccess ? (
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <MailCheck className="h-10 w-10 text-gold" />
          <p className="text-sm text-muted">{forgot.data.message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(({ email }) => forgot.mutate(email))} className="space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Button type="submit" size="lg" className="w-full" loading={forgot.isPending}>Send reset link</Button>
        </form>
      )}
    </AuthCard>
  )
}
