/**
 * VAT rate for price calculations (22% VAT)
 */
export const VAT_RATE = 1.22;

/**
 * Formats a numeric amount as Russian ruble string with kopecks
 * Format: XX XXX,XX руб.
 * - Thousands separated by regular space (U+0020)
 * - Comma for decimal separator
 * - Always 2 decimal places
 *
 * @param {number} amount - Amount to format
 * @returns {string} Formatted string like "11 111,00 руб."
 *
 * @example
 * formatRub(11111) // "11 111,00 руб."
 * formatRub(11111.5) // "11 111,50 руб."
 * formatRub(11111.555) // "11 111,56 руб."
 */
export function formatRub(amount) {
  // Handle invalid/missing values
  const num = Number(amount) || 0;

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  // Split into integer and decimal parts
  const [integerPart, decimalPart = ''] = rounded.toFixed(2).split('.');

  // Group integer part by thousands with regular space (U+0020)
  // Manual grouping to avoid locale issues (toLocaleString uses U+202F in ru-RU)
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Always pad decimal to 2 digits
  const kopecks = decimalPart.padEnd(2, '0');

  return `${grouped},${kopecks} руб.`;
}

/**
 * Calculates price breakdown with VAT (22%)
 * Returns 4 values: unit price and total price, each with and without VAT
 *
 * @param {number} clientPrice - Base price per unit (without VAT)
 * @param {number} qty - Quantity
 * @returns {{unitNoVat: number, unitWithVat: number, totalNoVat: number, totalWithVat: number}}
 *
 * @example
 * calcPriceBreakdown(10000, 5)
 * // { unitNoVat: 10000, unitWithVat: 12200, totalNoVat: 50000, totalWithVat: 61000 }
 *
 * calcPriceBreakdown(11111, 1)
 * // { unitNoVat: 11111, unitWithVat: 13555.42, totalNoVat: 11111, totalWithVat: 13555.42 }
 */
export function calcPriceBreakdown(clientPrice, qty) {
  const unitNoVat = clientPrice;
  const unitWithVat = Math.round(clientPrice * VAT_RATE * 100) / 100;
  const totalNoVat = clientPrice * qty;
  const totalWithVat = Math.round(clientPrice * qty * VAT_RATE * 100) / 100;

  return {
    unitNoVat,
    unitWithVat,
    totalNoVat,
    totalWithVat,
  };
}
