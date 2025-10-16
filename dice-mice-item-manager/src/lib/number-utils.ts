/**
 * Utility functions for consistent number formatting across server and client
 */

/**
 * Formats a number with comma separators in a consistent manner
 * Uses the 'en-US' locale to ensure consistent formatting between server and client
 * @param num The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a number as currency (for gold display)
 * @param amount The amount to format
 * @param currency The currency symbol (default: '')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = ''): string {
  const formatted = formatNumber(amount);
  return currency ? `${formatted} ${currency}` : formatted;
}
