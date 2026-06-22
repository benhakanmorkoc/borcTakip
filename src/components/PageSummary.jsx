import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { buildMonthlyReport } from '../lib/report'
import { formatMoney } from '../lib/format'
import MonthPicker from './MonthPicker'

export default function PageSummary({ monthlyLabel, monthlyAmount }) {
  const { state, selectedMonth, setSelectedMonth } = useFinance()
  const report = useMemo(
    () => buildMonthlyReport(state, selectedMonth),
    [state, selectedMonth]
  )

  const balanceTone = report.balance >= 0 ? 'money-positive' : 'money-negative'

  return (
    <div className="card space-y-3 p-4">
      <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{monthlyLabel}</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatMoney(monthlyAmount)}</p>
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
