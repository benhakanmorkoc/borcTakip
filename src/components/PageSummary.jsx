import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { buildHomeReport } from '../lib/report'
import { formatMoney, formatMonthLabel, currentYearMonth } from '../lib/format'
import MonthPicker from './MonthPicker'

export default function PageSummary({
  monthlyLabel,
  monthlyAmount,
  isProjected = false,
  projectedFrom = null,
}) {
  const { state, selectedMonth, setSelectedMonth } = useFinance()
  const cariAy = currentYearMonth()
  const report = useMemo(
    () => buildHomeReport(state, selectedMonth, cariAy),
    [state, selectedMonth, cariAy]
  )

  const balanceTone = report.balance >= 0 ? 'money-positive' : 'money-negative'
  const projected = isProjected || report.isProjected

  return (
    <div className="card space-y-3 p-4">
      <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {monthlyLabel}
            {projected && (
              <span className="ml-1 normal-case text-blue-600">(tahmini)</span>
            )}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatMoney(monthlyAmount)}</p>
          {projected && projectedFrom && (
            <p className="mt-0.5 text-[10px] text-gray-400 capitalize">
              {formatMonthLabel(projectedFrom)} baz alındı
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${report.balance >= 0 ? 'bg-brand-50' : 'bg-red-50'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Aylık bakiye</p>
          <p className={`mt-1 text-lg font-bold ${balanceTone}`}>
            {report.balance >= 0 ? '+' : ''}
            {formatMoney(report.balance)}
          </p>
        </div>
      </div>
    </div>
  )
}
