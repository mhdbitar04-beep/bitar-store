import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-xl bg-[linear-gradient(90deg,var(--surface-2),color-mix(in_oklab,var(--gold)_10%,var(--surface-2)),var(--surface-2))] bg-size-[200%_100%]',
        className,
      )}
    />
  )
}
