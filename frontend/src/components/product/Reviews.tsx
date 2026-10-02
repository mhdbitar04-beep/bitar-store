import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { StarInput, Stars } from '@/components/ui/Stars'
import { useCreateReview, useReviews } from '@/features/products/api'
import { applyFieldErrors } from '@/lib/api'
import { fadeUp, stagger } from '@/lib/motion'
import { useAuthStore } from '@/stores/authStore'
import type { ApiError } from '@/types/api'

const schema = z.object({
  rating: z.number().int().min(1, 'Choose a rating').max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10, 'Tell us a bit more (at least 10 characters)').max(2000),
})
type ReviewInput = z.infer<typeof schema>

export function Reviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useReviews(slug, page)
  const token = useAuthStore((s) => s.token)

  return (
    <section className="mt-20 grid gap-12 lg:grid-cols-[320px_1fr]" aria-labelledby="reviews-title">
      <div>
        <h2 id="reviews-title" className="text-3xl">Reviews</h2>
        {data && (
          <div className="mt-4 space-y-4">
            <div className="flex items-end gap-3">
              <span className="font-display text-5xl text-gold">{data.summary.average.toFixed(1)}</span>
              <div className="pb-1">
                <Stars value={data.summary.average} />
                <p className="mt-1 text-xs text-muted">{data.summary.count} reviews</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = data.summary.distribution[r] ?? 0
                const pct = data.summary.count ? (count / data.summary.count) * 100 : 0
                return (
                  <div key={r} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted">{r}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <motion.div className="gold-gradient h-full" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.4 }} />
                    </div>
                    <span className="w-6 text-right text-muted">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="mt-8">{token ? <ReviewForm slug={slug} /> : <p className="text-sm text-muted"><Link to="/login" className="text-gold hover:underline">Sign in</Link> to write a review.</p>}</div>
      </div>

      <div>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : data?.data.length ? (
          <>
            <motion.ul variants={stagger(0.06)} initial="hidden" animate="show" key={page} className="divide-y divide-line">
              {data.data.map((review) => (
                <motion.li key={review.id} variants={fadeUp} className="py-6 first:pt-0">
                  <div className="flex items-center justify-between gap-4">
                    <Stars value={review.rating} />
                    <time className="text-xs text-muted" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>
                  </div>
                  {review.title && <h3 className="mt-2 font-sans text-base font-semibold">{review.title}</h3>}
                  <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs">
                    <span className="font-medium">{review.user?.name}</span>
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-gold">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                      </span>
                    )}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
            <Pagination page={page} lastPage={data.meta.last_page} onChange={setPage} />
          </>
        ) : (
          <p className="text-muted">No reviews yet — be the first to share your thoughts.</p>
        )}
      </div>
    </section>
  )
}

function ReviewForm({ slug }: { slug: string }) {
  const create = useCreateReview(slug)
  const { register, handleSubmit, control, reset, setError, formState: { errors } } = useForm<ReviewInput>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, title: '', body: '' },
  })

  const onSubmit = (input: ReviewInput) =>
    create.mutate(input, {
      onSuccess: () => {
        toast.success('Thanks for your review!')
        reset()
      },
      onError: (e) => {
        const err = e as unknown as ApiError
        applyFieldErrors<keyof ReviewInput>(err, setError)
        toast.error(err.message)
      },
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5" noValidate>
      <h3 className="font-sans text-base font-semibold">Write a review</h3>
      <div>
        <Controller control={control} name="rating" render={({ field }) => <StarInput value={field.value} onChange={field.onChange} />} />
        {errors.rating && <p className="field-error">{errors.rating.message}</p>}
      </div>
      <Input placeholder="Title (optional)" {...register('title')} error={errors.title?.message} />
      <Textarea placeholder="What did you like or dislike?" {...register('body')} error={errors.body?.message} />
      <Button type="submit" loading={create.isPending} className="w-full">Submit review</Button>
    </form>
  )
}
