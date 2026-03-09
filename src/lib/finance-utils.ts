/**
 * Format amount with currency symbol.
 * currency: 'USD' | 'INR'
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: 'USD' | 'INR' = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0))
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      ...options,
    }).format(n)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  }).format(n)
}

/** Format number (no symbol), negative in red when applicable */
export function formatAmount(
  amount: number | string | null | undefined,
  decimals = 2
): string {
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0))
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function isNegative(amount: number | string | null | undefined): boolean {
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0))
  return n < 0
}
