export function formatMoney(value, currency = 'TRY') {
  const num = Number(value) || 0
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/** @deprecated formatMoney ile aynı — geriye dönük uyumluluk */
export const formatMoneyWhole = formatMoney

export function parseMoneyInput(value) {
  if (value === '' || value == null) return 0
  const normalized = String(value).replace(/\./g, '').replace(',', '.')
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : 0
}

export function formatMonthLabel(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

export function formatMonthShort(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
}

export function currentYearMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function yearMonthFromDate(dateStr) {
  if (!dateStr) return null
  return dateStr.slice(0, 7)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export function shiftYearMonth(yearMonth, delta) {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthDiff(from, to) {
  const [y1, m1] = from.split('-').map(Number)
  const [y2, m2] = to.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

export function compareYearMonth(a, b) {
  return a.localeCompare(b)
}
