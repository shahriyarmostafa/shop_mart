export function formatPrice(value: number) {
  return `৳${value.toLocaleString('en-IN')}`;
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
