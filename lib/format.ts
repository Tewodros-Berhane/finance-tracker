const currencyCodeMap: Record<string, string> = {
  BIRR: "ETB",
}

export function normalizeCurrencyCode(currency?: string | null) {
  if (!currency) return "USD"
  const normalized = currency.toUpperCase()
  return currencyCodeMap[normalized] ?? normalized
}

export function formatCurrency(
  value: number | string,
  currency?: string | null,
  options: Intl.NumberFormatOptions = {}
) {
  const numericValue = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(numericValue)) return String(value)

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizeCurrencyCode(currency),
    ...options,
  }).format(numericValue)
}
