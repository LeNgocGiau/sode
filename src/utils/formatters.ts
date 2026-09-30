/**
 * Format a number into Vietnamese currency representation with thousand dots
 * e.g. 10000 -> "10.000 ₫"
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

/**
 * Format raw number with thousand dots separator (e.g., 2000 -> "2.000")
 */
export function formatNumberWithDots(num: number | string): string {
  if (num === '' || num === null || num === undefined) return '';
  const cleanStr = String(num).replace(/\D/g, '');
  if (!cleanStr) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(cleanStr));
}

/**
 * Parse monetary input strings that may contain 'k', 'K', 'tr', 'm', commas or dots.
 * e.g. "2k" -> 2000
 * "10k" -> 10000
 * "2.000" -> 2000
 * "1.5tr" -> 1500000
 */
export function parseCurrencyInput(input: string): number {
  if (!input) return 0;
  const trimmed = input.trim().toLowerCase().replace(/,/g, '.');

  // Handle shorthand "k"
  if (trimmed.endsWith('k')) {
    const val = parseFloat(trimmed.replace('k', ''));
    return isNaN(val) ? 0 : Math.round(val * 1000);
  }

  // Handle shorthand "tr" or "m" (triệu)
  if (trimmed.endsWith('tr') || trimmed.endsWith('m')) {
    const val = parseFloat(trimmed.replace(/(tr|m)/g, ''));
    return isNaN(val) ? 0 : Math.round(val * 1000000);
  }

  // Clean all dots and non-digits
  const numericOnly = trimmed.replace(/\./g, '').replace(/[^\d]/g, '');
  const parsed = parseInt(numericOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date YYYY-MM-DD to Vietnamese display
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Check if a date string is today (local time)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Get current local date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's local date in YYYY-MM-DD format
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
