const formatters = new Map<string, Intl.NumberFormat>()

/** Formats integer cents, e.g. 129900 → "$1,299.00". */
export function formatMoney(cents: number, currency = 'usd'): string {
  const key = currency.toUpperCase()
  let fmt = formatters.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: key })
    formatters.set(key, fmt)
  }
  return fmt.format(cents / 100)
}

export const toCents = (dollars: number | string) => Math.round(Number(dollars) * 100)
export const toDollars = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2))
