import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import { formatMoney, formatMonthShort } from '../lib/format'

const MONTHS_PER_PERIOD = 6

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

function PeriodChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={4} barCategoryGap="18%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 11, fill: '#6b7280' }}
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
        <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Bar dataKey="odenecek" name="Ödenecek" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function MonthlyComparisonChart({ data }) {
  const scrollRef = useRef(null)

  const periods = useMemo(() => {
    const chunks = []
    for (let i = 0; i < data.length; i += MONTHS_PER_PERIOD) {
      chunks.push(data.slice(i, i + MONTHS_PER_PERIOD))
    }
    return chunks.length > 0 ? chunks : [[]]
  }, [data])

  const scrollByPeriod = (direction) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] text-gray-500">
          6 aylık periyot · sağa kaydırın
          {periods.length > 1 && (
            <span className="ml-1 text-gray-400">
              ({periods.length} periyot, {data.length} ay)
            </span>
          )}
        </p>
        {periods.length > 1 && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => scrollByPeriod(-1)}
              className="btn-secondary p-1"
              aria-label="Önceki 6 ay"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollByPeriod(1)}
              className="btn-secondary p-1"
              aria-label="Sonraki 6 ay"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex h-72 overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:thin]"
      >
        {periods.map((chunk, index) => {
          const rangeLabel =
            chunk.length > 0
              ? `${formatMonthShort(chunk[0].yearMonth)} – ${formatMonthShort(chunk[chunk.length - 1].yearMonth)}`
              : ''
          return (
            <div key={index} className="flex h-full min-w-full shrink-0 snap-start flex-col">
              {rangeLabel && (
                <p className="mb-1 px-1 text-center text-[10px] font-medium capitalize text-gray-400">
                  {rangeLabel}
                </p>
              )}
              <div className="min-h-0 flex-1">
                <PeriodChart data={chunk} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
