import { forwardRef, type ComponentProps, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface WrapperProps {
  label?: string
  error?: string
  hint?: ReactNode
  id?: string
  children: ReactNode
  className?: string
}

function Wrapper({ label, error, hint, id, children, className }: WrapperProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: ReactNode; wrapperClassName?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, id, name, className, wrapperClassName, ...props }, ref) => {
  const inputId = id ?? name
  return (
    <Wrapper label={label} error={error} hint={hint} id={inputId} className={wrapperClassName}>
      <input
        ref={ref}
        id={inputId}
        name={name}
        aria-invalid={!!error}
        className={cn('field', error && 'border-danger', className)}
        {...props}
      />
    </Wrapper>
  )
})
Input.displayName = 'Input'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; wrapperClassName?: string }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, id, name, className, wrapperClassName, ...props }, ref) => {
  const inputId = id ?? name
  return (
    <Wrapper label={label} error={error} id={inputId} className={wrapperClassName}>
      <textarea ref={ref} id={inputId} name={name} aria-invalid={!!error} className={cn('field min-h-28', error && 'border-danger', className)} {...props} />
    </Wrapper>
  )
})
Textarea.displayName = 'Textarea'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; wrapperClassName?: string }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, id, name, className, wrapperClassName, children, ...props }, ref) => {
  const inputId = id ?? name
  return (
    <Wrapper label={label} error={error} id={inputId} className={wrapperClassName}>
      <select ref={ref} id={inputId} name={name} aria-invalid={!!error} className={cn('field cursor-pointer', error && 'border-danger', className)} {...props}>
        {children}
      </select>
    </Wrapper>
  )
})
Select.displayName = 'Select'

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm', className)}>
      <input type="checkbox" className="h-4 w-4 cursor-pointer rounded accent-(--gold)" {...props} />
      {label}
    </label>
  )
}
