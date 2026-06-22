import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { buildMultiMonthChartData, buildHomeReport, findFirstSurplusMonth } from '../lib/report'
import { currentYearMonth, formatMoney, formatMonthLabel } from '../lib/format'
import MonthPicker from '../components/MonthPicker'
import MonthlyComparisonChart from '../components/MonthlyComparisonChart'
import { TrendingUp, CalendarCheck, Info } from 'lucide-react'

function SummaryField({ label, value, tone = 'neutral', sub }) {

  const toneClass =

    tone === 'positive'

      ? 'text-brand-700'

      : tone === 'negative'

        ? 'text-danger'

        : tone === 'warning'

          ? 'text-amber-900'

          : 'text-gray-900'

  return (

    <div className="rounded-xl bg-gray-50 p-2.5">

      <p className="text-gray-500">{label}</p>

      <p className={`font-bold ${toneClass}`}>{formatMoney(value)}</p>

      {sub}

    </div>

  )

}



export default function Home() {

  const { state, selectedMonth, setSelectedMonth } = useFinance()

  const cariAy = currentYearMonth()



  const chartData = useMemo(() => buildMultiMonthChartData(state, cariAy), [state, cariAy])

  const surplus = useMemo(() => findFirstSurplusMonth(state, cariAy), [state, cariAy])

  const report = useMemo(

    () => buildHomeReport(state, selectedMonth, cariAy),

    [state, selectedMonth, cariAy]

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

              {surplus.report.isProjected && (

                <span className="ml-1 text-[10px] font-normal text-brand-700">(tahmini)</span>

              )}

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



        {report.isProjected && (

          <div className="mt-2 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2 text-[11px] text-blue-800">

            <Info size={14} className="mt-0.5 shrink-0" />

            <p>

              <strong>Tahmini</strong> — {formatMonthLabel(report.projectedFrom)} ayındaki değerler

              kullanılıyor. Bu ay geldiğinde gerçek tutarları manuel güncelleyebilirsiniz.

            </p>

          </div>

        )}



        <div className="mt-3 rounded-xl bg-brand-50 p-2.5 text-xs">

          <p className="text-gray-500">Seçili ay gelir</p>

          <p className="font-bold text-brand-700">{formatMoney(report.totalIncome)}</p>

        </div>



        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <SummaryField label="Toplam Min Tutar" value={report.totalMinAmount} />
          <SummaryField label="Ödenen Tutar" value={report.totalPaidAmount} tone="positive" />
          <SummaryField label="Kalan min Tutar" value={report.remainingMinAmount} tone="negative" />
          <SummaryField label="Kart Toplam Borç" value={report.totalCardPayoff} tone="warning" />
          <SummaryField label="Kredi Kapama" value={report.totalLoanPayoff} tone="warning" />
          <SummaryField label="Negatif Bakiyeler" value={report.totalNegativeBalanceGross} />
          <SummaryField
            label="Tüm Borçlar Toplamı"
            value={report.grandTotalAllDebt}
            tone="warning"
          />
        </div>

        <div className="mt-2 rounded-xl border border-red-100 bg-red-50 p-2.5 text-xs">
          <p className="text-gray-500">Ödenecek tutar</p>
          <p className="text-lg font-bold text-danger">{formatMoney(report.remainingMinAmount)}</p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            Ödenmemiş kart min. + kredi taksit + diğer ödemeler (negatif bakiye hariç)
          </p>
          <div className="mt-1 space-y-0.5 text-[10px] text-gray-500">
            <p className="flex justify-between gap-2">
              <span>Kart min. ödeme</span>
              <span className="font-medium text-gray-700">
                {formatMoney(report.totalCardMinGross)}
                {report.totalCardMinPaid > 0 && (
                  <span className="text-brand-600"> · ödenen {formatMoney(report.totalCardMinPaid)}</span>
                )}
              </span>
            </p>
            <p className="flex justify-between gap-2">
              <span>Kredi taksit</span>
              <span className="font-medium text-gray-700">
                {formatMoney(report.totalLoanGross)}
                {report.totalLoanPaid > 0 && (
                  <span className="text-brand-600"> · ödenen {formatMoney(report.totalLoanPaid)}</span>
                )}
              </span>
            </p>
            {report.totalOtherGross > 0 && (
              <p className="flex justify-between gap-2">
                <span>Diğer ödeme</span>
                <span className="font-medium text-gray-700">
                  {formatMoney(report.totalOtherGross)}
                  {report.totalOtherPaid > 0 && (
                    <span className="text-brand-600"> · ödenen {formatMoney(report.totalOtherPaid)}</span>
                  )}
                </span>
              </p>
            )}
            {report.totalNegativeBalanceGross > 0 && (
              <p className="flex justify-between gap-2">
                <span>Negatif bakiye</span>
                <span className="font-medium text-gray-700">
                  {formatMoney(report.totalNegativeBalanceGross)}
                  {report.totalNegativeBalancePaid > 0 && (
                    <span className="text-brand-600">
                      {' '}
                      · ödenen {formatMoney(report.totalNegativeBalancePaid)}
                    </span>
                  )}
                </span>
              </p>
            )}
          </div>
        </div>

      </div>



      <div className="card p-3">

        <div className="mb-3 flex items-center gap-2 px-1">

          <TrendingUp size={16} className="text-brand-700" />

          <h3 className="text-sm font-semibold text-gray-900">Aylık karşılaştırma</h3>

        </div>

        <MonthlyComparisonChart data={chartData} />

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

                <th className="px-3 py-2 font-semibold">Ödenecek</th>

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

                    <td className="px-3 py-2 font-medium capitalize">

                      {formatMonthLabel(row.yearMonth)}

                      {row.isProjected && (

                        <span className="ml-1 text-[10px] text-blue-600">tahmini</span>

                      )}

                    </td>

                    <td className="px-3 py-2 text-brand-700">{formatMoney(row.gelir)}</td>

                    <td className="px-3 py-2 text-danger">{formatMoney(row.odenecek)}</td>

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


