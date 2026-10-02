import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import type { ProductOption, Variant } from '@/types/api'

interface Props {
  options: ProductOption[]
  variants: Variant[]
  selected: Record<number, number>
  onChange: (attributeId: number, valueId: number) => void
}

/**
 * Renders one picker per attribute (color swatches / size chips) and greys out
 * values that have no in-stock variant compatible with the other selections.
 */
export function VariantPicker({ options, variants, selected, onChange }: Props) {
  const isAvailable = (attributeId: number, valueId: number) => {
    const wanted = { ...selected, [attributeId]: valueId }
    return variants.some(
      (v) =>
        v.stock > 0 &&
        Object.values(wanted).every((id) => v.attribute_values?.some((av) => av.id === id)),
    )
  }

  return (
    <div className="space-y-5">
      {options.map((option) => {
        const current = option.values.find((v) => v.id === selected[option.attribute.id])
        return (
          <fieldset key={option.attribute.id}>
            <legend className="mb-2 text-sm">
              <span className="text-muted">{option.attribute.name}:</span> <span className="font-medium">{current?.value ?? 'Select'}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const active = selected[option.attribute.id] === value.id
                const available = isAvailable(option.attribute.id, value.id)

                if (option.attribute.type === 'color') {
                  return (
                    <motion.button
                      key={value.id}
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onChange(option.attribute.id, value.id)}
                      aria-label={`${value.value}${available ? '' : ' (out of stock)'}`}
                      aria-pressed={active}
                      className={cn(
                        'relative h-10 w-10 cursor-pointer rounded-full border-2 p-0.5 transition-all duration-200',
                        active ? 'border-gold' : 'border-line hover:border-muted',
                        !available && 'opacity-40',
                      )}
                    >
                      <span className="block h-full w-full rounded-full border border-black/10" style={{ background: value.color_hex ?? '#888' }} />
                      {!available && <span className="absolute inset-0 m-auto h-px w-8 rotate-45 bg-muted" />}
                    </motion.button>
                  )
                }

                return (
                  <motion.button
                    key={value.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange(option.attribute.id, value.id)}
                    aria-pressed={active}
                    className={cn(
                      'min-w-12 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                      active ? 'gold-gradient border-transparent text-on-gold' : 'border-line hover:border-gold',
                      !available && !active && 'text-muted line-through opacity-50',
                    )}
                  >
                    {value.value}
                  </motion.button>
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
