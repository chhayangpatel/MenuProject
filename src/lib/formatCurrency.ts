/**
 * Locale-aware currency formatting.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  currencySymbol: string = '$'
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback to simple symbol prefix
    return `${currencySymbol}${amount.toFixed(2)}`;
  }
}
