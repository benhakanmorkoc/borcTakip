import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { buildHomeReport } from '../lib/report'
import { formatMoney, formatMonthLabel, currentYearMonth } from '../lib/format'
import MonthPicker from './MonthPicker'

function SummaryCell({ label, value, tone = 'neutral', sub, projected, formatValue = formatMoney, valueClassName = 'mt-1 text-lg font-bold' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-brand-700'
      : tone === 'negative'
        ? 'text-danger'
        : tone === 'warning'
          ? 'text-amber-900'
          : 'text-gray-900'
  const bgClass =
    tone === 'positive'
      ? 'bg-brand-50'
      : tone === 'negative'
        ? 'bg-red-50'
        : tone === 'warning'
          ? 'bg-amber-50'
          : 'bg-gray-50'

  return (
    <div className={`rounded-xl p-3 ${bgClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
        {projected && <span className="ml-1 normal-case text-blue-600">(tahmini)</span>}
      </p>
      <p className={`${valueClassName} ${toneClass}`}>{formatValue(value)}</p>
      {sub}
    </div>
  )
}

export default function PageSummary({
  fields = null,
  monthlyLabel,
  monthlyAmount,
  isProjected = false,
  projectedFrom = null,
  formatValue = formatMoney,
  valueClassName = 'mt-1 text-lg font-bold',
}) {
  const { state, selectedMonth, setSelectedMonth } = useFinance()
  const cariAy = currentYearMonth()
  const report = useMemo(
    () => buildHomeReport(state, selectedMonth, cariAy),
    [state, selectedMonth, cariAy]
  )

  const projected = isProjected || report.isProjected
  const projectedNote =
    projected && projectedFrom ? (
      <p className="mt-0.5 text-[10px] text-gray-400 capitalize">
        {formatMonthLabel(projectedFrom)} baz alındı
      </p>
    ) : null

  const defaultFields = monthlyLabel
    ? [
        {
          label: monthlyLabel,
          value: monthlyAmount,
          sub: projectedNote,
        },
        {
          label: 'Aylık bakiye',
          value: report.balance,
          tone: report.balance >= 0 ? 'positive' : 'negative',
        },
      ]
    : []

  const cells = fields || defaultFields

  return (
    <div className="card space-y-3 p-4">
      <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      <div
        className={`grid gap-3 ${
          cells.length >= 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : cells.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-2'
        }`}
      >
        {cells.map((cell, index) => (
          <SummaryCell
            key={cell.label}
            label={cell.label}
            value={cell.value}
            tone={cell.tone}
            projected={cell.showProjected !== false && projected && index === 0}
            sub={cell.sub ?? (index === 0 ? projectedNote : null)}
            formatValue={formatValue}
            valueClassName={valueClassName}
          />
        ))}
      </div>
    </div>
  )
}
