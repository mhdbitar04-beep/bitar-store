import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useChangePassword, useUpdateProfile } from '@/features/auth/api'
import { changePasswordSchema, profileSchema, type ChangePasswordInput, type ProfileInput } from '@/features/auth/schemas'
import { useAddresses } from '@/features/orders/api'
import { api, applyFieldErrors } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useAuthStore } from '@/stores/authStore'
import type { ApiError } from '@/types/api'

export default function ProfilePage() {
  useDocumentTitle('Profile')
  const user = useAuthStore((s) => s.user)!
  const update = useUpdateProfile()
  const changePassword = useChangePassword()
  const { data: addresses } = useAddresses()
  const qc = useQueryClient()
  const removeAddress = useMutation({
    mutationFn: (id: number) => api.delete(`/account/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const profile = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? '' },
  })
  const password = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) })

  return (
    <div className="container-x max-w-4xl py-10">
      <p className="eyebrow mb-2">Account</p>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl">Hello, {user.name.split(' ')[0]}</h1>
        <Link to="/account/orders" className="text-sm font-semibold text-gold hover:underline">View my orders →</Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <form
          className="card space-y-4 p-6"
          noValidate
          onSubmit={profile.handleSubmit((input) =>
            update.mutate(input, {
              onSuccess: () => toast.success('Profile updated'),
              onError: (e) => applyFieldErrors<keyof ProfileInput>(e as unknown as ApiError, profile.setError),
            }),
          )}
        >
          <h2 className="font-sans text-lg font-semibold">Personal details</h2>
          <Input label="Name" {...profile.register('name')} error={profile.formState.errors.name?.message} />
          <Input label="Email" type="email" {...profile.register('email')} error={profile.formState.errors.email?.message} />
          <Input label="Phone" type="tel" {...profile.register('phone')} error={profile.formState.errors.phone?.message} />
          <Button type="submit" loading={update.isPending}>Save changes</Button>
        </form>

        <form
          className="card space-y-4 p-6"
          noValidate
          onSubmit={password.handleSubmit((input) =>
            changePassword.mutate(input, {
              onSuccess: () => {
                toast.success('Password changed — other devices were signed out')
                password.reset({ current_password: '', password: '', password_confirmation: '' })
              },
              onError: (e) => applyFieldErrors<keyof ChangePasswordInput>(e as unknown as ApiError, password.setError),
            }),
          )}
        >
          <h2 className="font-sans text-lg font-semibold">Change password</h2>
          <Input label="Current password" type="password" autoComplete="current-password" {...password.register('current_password')} error={password.formState.errors.current_password?.message} />
          <Input label="New password" type="password" autoComplete="new-password" {...password.register('password')} error={password.formState.errors.password?.message} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" {...password.register('password_confirmation')} error={password.formState.errors.password_confirmation?.message} />
          <Button type="submit" variant="outline" loading={changePassword.isPending}>Update password</Button>
        </form>
      </div>

      <section className="card mt-8 p-6">
        <h2 className="mb-4 font-sans text-lg font-semibold">Saved addresses</h2>
        {addresses?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="font-medium">{a.label} {a.is_default && <span className="text-xs text-gold">(default)</span>}</p>
                  <p className="text-muted">{a.full_name}, {a.line1}, {a.city} {a.postal_code}, {a.country_code}</p>
                </div>
                <button onClick={() => removeAddress.mutate(a.id!)} className="cursor-pointer p-1 text-muted hover:text-danger" aria-label="Delete address">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Addresses you save at checkout will appear here.</p>
        )}
      </section>
    </div>
  )
}
