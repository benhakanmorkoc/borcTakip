import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import {
  buildMultiMonthChartData,
  buildMonthlyReport,
  findFirstSurplusMonth,
} from '../lib/report'
import { formatMoney, formatMonthLabel } from '../lib/format'
import MonthPicker from '../components/MonthPicker'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp, CalendarCheck } from 'lucide-react'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-gray-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex justify-between gap-4">
          <span>{entry.name}</span>
          <span className="font-medium">{formatMoney(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Home() {
  const { state, selectedMonth, setSelectedMonth } = useFinance()

  const chartData = useMemo(() => buildMultiMonthChartData(state), [state])
  const surplus = useMemo(() => findFirstSurplusMonth(state), [state])
  const currentReport = useMemo(
    () => buildMonthlyReport(state, selectedMonth),
    [state, selectedMonth]
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Ana Sayfa</h2>
        <p className="text-sm text-gray-500">Ay ay gelir ve gider karşılaştırması</p>
      </div>

      {surplus ? (
        <div className="card flex items-start gap-3 border-brand-200 bg-brand-50 p-4">
          <CalendarCheck className="shrink-0 text-brand-700" size={22} />
          <div>
            <p className="font-semibold text-brand-900">İlk fazla ay</p>
            <p className="mt-1 text-sm text-brand-800 capitalize">
              {formatMonthLabel(surplus.yearMonth)} — gelir giderleri{' '}
              <strong>{formatMoney(surplus.report.balance)}</strong> geçiyor
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-sm text-gray-500">
          Girilen verilere göre gelirin giderleri geçtiği bir ay henüz yok. Gelecek aylar için gelir ve
          gider girişi yaparak projeksiyonu güncelleyebilirsiniz.
        </div>
      )}

      <div className="card p-4">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-brand-50 p-2.5">
            <p className="text-gray-500">Seçili ay gelir</p>
            <p className="font-bold text-brand-700">{formatMoney(currentReport.totalIncome)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-2.5">
            <p className="text-gray-500">Seçili ay gider</p>
            <p className="font-bold text-danger">{formatMoney(currentReport.totalExpenses)}</p>
          </div>
        </div>
      </div>

      <div className="card p-3">
        <div className="mb-3 flex items-center gap-2 px-1">
          <TrendingUp size={16} className="text-brand-700" />
          <h3 className="text-sm font-semibold text-gray-900">Aylık karşılaştırma</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={4} barCategoryGap="24%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} iconSize={8} />
              <ReferenceLine y={0} stroke="#e5e7eb" />
              <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="toplamGider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Ay bazlı tablo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Ay</th>
                <th className="px-3 py-2 font-semibold">Gelir</th>
                <th className="px-3 py-2 font-semibold">Gider</th>
                <th className="px-3 py-2 font-semibold">Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {chartData.map((row) => {
                const isSurplus = row.bakiye > 0
                const isFirstSurplus = surplus?.yearMonth === row.yearMonth
                return (
                  <tr
                    key={row.yearMonth}
                    className={isFirstSurplus ? 'bg-brand-50' : isSurplus ? 'bg-green-50/50' : ''}
                  >
                    <td className="px-3 py-2 font-medium capitalize">{formatMonthLabel(row.yearMonth)}</td>
                    <td className="px-3 py-2 text-brand-700">{formatMoney(row.gelir)}</td>
                    <td className="px-3 py-2 text-danger">{formatMoney(row.toplamGider)}</td>
                    <td className={`px-3 py-2 font-semibold ${row.bakiye >= 0 ? 'text-brand-700' : 'text-danger'}`}>
                      {row.bakiye >= 0 ? '+' : ''}
                      {formatMoney(row.bakiye)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
