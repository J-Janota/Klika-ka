export function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(2) + 'K'
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}
