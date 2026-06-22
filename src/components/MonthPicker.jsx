import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLabel } from '../lib/format'

function shiftMonth(yearMonth, delta) {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  const ny = date.getFullYear()
  const nm = String(date.getMonth() + 1).padStart(2, '0')
  return `${ny}-${nm}`
}

export default function MonthPicker({ value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600"
        aria-label="Önceki ay"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex-1 text-center">
        <p className="text-sm text-gray-500">Seçili dönem</p>
        <p className="text-base font-bold capitalize text-gray-900">{formatMonthLabel(value)}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600"
        aria-label="Sonraki ay"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
