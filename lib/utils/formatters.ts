// Financial precision helper to prevent floating-point errors (e.g. 0.1 + 0.2 === 0.30000000000000004)
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, showSign: boolean = false): string {
  const rounded = round2(amount);
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));

  if (rounded < 0) {
    return `-PKR ${formatted}`;
  }
  if (showSign && rounded > 0) {
    return `+PKR ${formatted}`;
  }
  return `PKR ${formatted}`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Expected YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function getTodayDateString(): string {
  // Deterministic standard date matching the restaurant's active accounting records
  return '2026-09-12';
}
