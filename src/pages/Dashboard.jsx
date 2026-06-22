import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { buildMonthlyReport } from '../lib/report'
import { formatDate, formatMoney, currentYearMonth } from '../lib/format'
import MonthPicker from '../components/MonthPicker'
import { TrendingDown, TrendingUp, Scale, Wallet } from 'lucide-react'

function SummaryCard({ title, amount, tone, icon: Icon }) {
  const toneClass =
    tone === 'positive' ? 'money-positive' : tone === 'negative' ? 'money-negative' : 'text-gray-900'
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      <p className={`text-xl font-bold ${toneClass}`}>{formatMoney(amount)}</p>
    </div>
  )
}

function Section({ title, items, emptyText, variant }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => {
            const isPaid = variant === 'expense' && item.paid
            return (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate font-medium ${isPaid ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    {isPaid && item.paidLabel && (
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                        {item.paidLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.category}
                    {item.detail
                      ? ` · ${item.category === 'Kredi Kartı' || item.category === 'Banka Kredisi' ? item.detail : formatDate(item.detail)}`
                      : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={
                      variant === 'income' ? 'money-positive' : isPaid ? 'text-gray-400 line-through' : 'money-negative'
                    }
                  >
                    {variant === 'income' ? '+' : '−'}
                    {formatMoney(item.amount)}
                  </span>
                  {isPaid && (
                    <p className="text-[10px] font-medium text-brand-600">Kalan: {formatMoney(0)}</p>
                  )}
                  {variant === 'expense' && !isPaid && <p className="text-[10px] text-gray-400">Kalan</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { state, selectedMonth, setSelectedMonth } = useFinance()
  const cariAy = currentYearMonth()
  const report = useMemo(
    () => buildMonthlyReport(state, selectedMonth, cariAy),
    [state, selectedMonth, cariAy]
  )

  const monthlyBalance = report.incomeBalance
  const balanceTone = monthlyBalance >= 0 ? 'positive' : 'negative'
  const paidRegular =
    report.totalCardMinPaid + report.totalLoanPaid + report.totalOtherPaid

  const debtRows = [
    { label: 'Cari ay kart min. ödeme', value: report.totalCardMinPayment },
    { label: 'Toplam kart kapama', value: report.totalCardPayoff },
    { label: 'Cari ay ödenmemiş kredi taksidi', value: report.totalLoanInstallment },
    { label: 'Kredi kalan toplam (ileri)', value: report.totalLoanForward },
    { label: 'Toplam kredi kapama', value: report.totalLoanPayoff },
    { label: 'Cari ay diğer ödeme', value: report.totalOtherPayment },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryCard title="Toplam Gelir" amount={report.totalIncome} tone="positive" icon={TrendingUp} />
        <SummaryCard title="Giderler" amount={report.totalMinAmount} tone="negative" icon={TrendingDown} />
        <SummaryCard title="Ödenecek" amount={report.remainingMinAmount} tone="negative" icon={Wallet} />
        {paidRegular > 0 && (
          <div className="card px-4 py-3 text-sm text-gray-600 sm:col-span-2">
            Bu ay ödenen:{' '}
            <span className="font-semibold text-brand-700">{formatMoney(paidRegular)}</span>
          </div>
        )}
        <div className={`card p-4 sm:col-span-2 ${monthlyBalance >= 0 ? 'ring-2 ring-brand-200' : 'ring-2 ring-red-200'}`}>
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Scale size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Aylık Bakiye</span>
          </div>
          <p className={`text-2xl font-bold ${balanceTone === 'positive' ? 'money-positive' : 'money-negative'}`}>
            {monthlyBalance >= 0 ? '+' : ''}
            {formatMoney(monthlyBalance)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {monthlyBalance >= 0 ? 'Bu ay gelirler giderleri karşılıyor.' : 'Bu ay giderler geliri aşıyor.'}
          </p>
        </div>
      </div>

      <div className="card p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Toplam borç özeti</p>
        <ul className="mt-3 space-y-2">
          {debtRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
              <span className="text-xs text-gray-500">{row.label}</span>
              <span className="font-semibold text-gray-900">{formatMoney(row.value)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-gray-100 pt-3 text-right text-xs text-gray-500">
          Genel kapama toplamı:{' '}
          <span className="font-bold text-gray-900">{formatMoney(report.grandTotalDebt)}</span>
        </p>
      </div>

      <Section
        title="Giderler"
        items={report.expenses}
        emptyText="Bu ay için kayıtlı gider yok."
        variant="expense"
      />
      <Section
        title="Gelirler"
        items={report.incomes}
        emptyText="Bu ay için kayıtlı gelir yok."
        variant="income"
      />
    </div>
  )
}
