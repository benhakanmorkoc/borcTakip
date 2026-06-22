/** Türkçe metni karşılaştırma için normalize eder */
function normalizeTr(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim()
}

const NEGATIVE_BALANCE_TYPE_LABELS = new Set([
  'negatif bakiye',
  'negatif bakiyeler',
  'negatif bakiyeleri',
  'negatif bakiye odemesi',
  'negatif bakiye ödemesi',
])

/** Diğer ödemelerde negatif bakiye kalemi mi? type, name ve note birlikte kontrol edilir */
export function isNegativeBalanceType(type) {
  const normalized = normalizeTr(type)
  if (!normalized) return false
  if (NEGATIVE_BALANCE_TYPE_LABELS.has(normalized)) return true
  return normalized.includes('negatif') && normalized.includes('bakiy')
}

export function isNegativeBalancePayment(payment) {
  if (!payment) return false

  const fields = [payment.type, payment.name, payment.note]
  for (const field of fields) {
    if (isNegativeBalanceType(field)) return true
  }

  const combined = normalizeTr(fields.filter(Boolean).join(' '))
  return combined.includes('negatif') && combined.includes('bakiy')
}
