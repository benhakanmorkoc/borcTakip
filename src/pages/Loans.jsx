import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { buildMonthlyReport } from '../lib/report'
import {
  buildAllLoanSchedules,
  buildLoanFullSchedule,
  createFutureInstallment,
  scheduleTotals,
} from '../lib/loanSchedule'
import { buildLoanPayload, getPaymentsRemaining, isLoanClosed, loanForwardTotal, getLoanEndMonth, getLoanStartMonth } from '../lib/loanUtils'
import { formatMoney, formatMonthLabel, shiftYearMonth } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'
import PaidToggle from '../components/PaidToggle'
import PageSummary from '../components/PageSummary'

const emptyForm = (startMonth) => ({
  bankName: '',
  monthlyPayment: 0,
  totalTerms: 12,
  remainingTerms: 4,
  payoffAmount: 0,
  installmentPaid: false,
  startMonth: startMonth || '',
  futureInstallments: [],
})

const emptyFutureForm = (loanId, anchorMonth) => ({
  loanId: loanId || '',
  month: shiftYearMonth(anchorMonth, 1),
  amount: 0,
  note: '',
  paid: false,
})

export default function Loans() {
  const { state, selectedMonth, addLoan, updateLoan, removeLoan } = useFinance()
  const [open, setOpen] = useState(false)
  const [futureOpen, setFutureOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingFuture, setEditingFuture] = useState(null)
  const [form, setForm] = useState(() => emptyForm(''))
  const [futureForm, setFutureForm] = useState(emptyFutureForm('', selectedMonth))

  const monthlyTotal = useMemo(() => {
    const report = buildMonthlyReport(state, selectedMonth, selectedMonth)
    return report.totalLoanInstallment
  }, [state, selectedMonth])

  const forwardTotal = useMemo(() => {
    const report = buildMonthlyReport(state, selectedMonth, selectedMonth)
    return report.totalLoanForward
  }, [state, selectedMonth])

  const scheduleRows = useMemo(
    () => buildAllLoanSchedules(state.loans, selectedMonth, selectedMonth),
    [state.loans, selectedMonth]
  )

  const totals = useMemo(() => scheduleTotals(scheduleRows), [scheduleRows])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm(selectedMonth))
    setOpen(true)
  }

  const openEdit = (loan) => {
    setEditing(loan.id)
    setForm({
      bankName: loan.bankName,
      monthlyPayment: loan.monthlyPayment,
      totalTerms: loan.totalTerms ?? loan.remainingTerms ?? 1,
      remainingTerms: loan.remainingTerms ?? 1,
      payoffAmount: loan.payoffAmount,
      installmentPaid: Boolean(loan.installmentPaid),
      startMonth: loan.startMonth || getLoanStartMonth(loan),
      futureInstallments: loan.futureInstallments || [],
    })
    setOpen(true)
  }

  const openNewFuture = (loanId = '') => {
    const loan = state.loans.find((l) => l.id === loanId)
    setEditingFuture(null)
    setFutureForm({
      ...emptyFutureForm(loanId, selectedMonth),
      amount: loan?.monthlyPayment || 0,
    })
    setFutureOpen(true)
  }

  const openEditFuture = (loanId, installment) => {
    setEditingFuture({ loanId, id: installment.id })
    setFutureForm({
      loanId,
      month: installment.month,
      amount: installment.amount,
      note: installment.note || '',
      paid: Boolean(installment.paid),
    })
    setFutureOpen(true)
  }

  const saveFutureInstallment = (e) => {
    e.preventDefault()
    const loan = state.loans.find((l) => l.id === futureForm.loanId)
    if (!loan) return

    const list = [...(loan.futureInstallments || [])]
    if (editingFuture) {
      const idx = list.findIndex((x) => x.id === editingFuture.id)
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          month: futureForm.month,
          amount: futureForm.amount,
          note: futureForm.note,
          paid: futureForm.paid,
        }
      }
    } else {
      list.push(createFutureInstallment(futureForm))
    }
    list.sort((a, b) => a.month.localeCompare(b.month))
    updateLoan(loan.id, { futureInstallments: list })
    setFutureOpen(false)
  }

  const removeFutureInstallment = (loanId, installmentId) => {
    const loan = state.loans.find((l) => l.id === loanId)
    if (!loan) return
    updateLoan(loan.id, {
      futureInstallments: (loan.futureInstallments || []).filter((x) => x.id !== installmentId),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.bankName.trim()) return
    const payload = buildLoanPayload(
      { ...form, startMonth: form.startMonth || selectedMonth },
      selectedMonth
    )
    if (editing) updateLoan(editing, payload)
    else addLoan(payload)
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <PageSummary monthlyLabel="Bu ay kredi taksit" monthlyAmount={monthlyTotal} />

      <div className="card px-4 py-3 text-sm">
        <span className="text-gray-500">Seçili aydan kalan kredi toplamı: </span>
        <span className="font-bold text-danger">{formatMoney(forwardTotal)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Banka Kredileri</h2>
          <p className="text-sm text-gray-500">Aylık taksit, vade ve kapama tutarı</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary px-3 py-2">
          <Plus size={18} />
          Ekle
        </button>
      </div>

      {state.loans.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Henüz kredi eklenmedi.</div>
      ) : (
        <ul className="space-y-3">
          {state.loans.map((loan) => {
            const totalTerms = Number(loan.totalTerms) || Number(loan.remainingTerms) || 1
            const paymentsLeft = getPaymentsRemaining(loan, selectedMonth)
            const closed = isLoanClosed(loan, selectedMonth)
            const loanSchedule = buildLoanFullSchedule(loan, selectedMonth, selectedMonth)
            const forward = loanForwardTotal(loan, selectedMonth, selectedMonth)
            return (
              <li key={loan.id} className={`card p-4 ${closed ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{loan.bankName}</p>
                    <p className="text-xs text-gray-500">
                      {closed
                        ? `Kapandı · ${formatMonthLabel(getLoanEndMonth(loan))}`
                        : `${paymentsLeft} ay kaldı · ${formatMonthLabel(getLoanStartMonth(loan))} – ${formatMonthLabel(getLoanEndMonth(loan))}`}
                    </p>
                    {!closed && (
                      <p className="text-xs text-danger">Kalan toplam: {formatMoney(forward)}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(loan)} className="btn-danger">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => removeLoan(loan.id)} className="btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className={`rounded-xl p-3 ${loan.installmentPaid ? 'bg-brand-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-500">Aylık ödeme</p>
                    <p
                      className={`font-semibold ${loan.installmentPaid ? 'text-brand-700 line-through' : 'money-negative'}`}
                    >
                      {formatMoney(loan.monthlyPayment)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Kapama tutarı</p>
                    <p className="font-semibold">{formatMoney(loan.payoffAmount)}</p>
                  </div>
                </div>
                {!closed && (
                  <div className="mt-3">
                    <PaidToggle
                      label="Taksit ödendi"
                      checked={Boolean(loan.installmentPaid)}
                      onChange={(v) => updateLoan(loan.id, { installmentPaid: v })}
                    />
                  </div>
                )}

                {loanSchedule.length > 0 && !closed && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      İleri vade özeti
                    </p>
                    <ul className="space-y-1.5 text-xs">
                      {loanSchedule.map((row) => (
                        <li key={row.id} className="flex justify-between gap-2">
                          <span className={row.paid ? 'text-gray-400 line-through' : 'text-gray-700'}>
                            {formatMonthLabel(row.month)}
                            {row.source === 'current' && (
                              <span className="ml-1 text-[10px] text-brand-600">bu ay</span>
                            )}
                            {row.source === 'manual' && (
                              <span className="ml-1 text-[10px] text-purple-600">manuel</span>
                            )}
                            {row.paymentsLeft != null && (
                              <span className="ml-1 text-[10px] text-gray-400">({row.paymentsLeft} ay)</span>
                            )}
                          </span>
                          <span className={row.paid ? 'text-brand-700' : 'money-negative'}>
                            {formatMoney(row.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {state.loans.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-brand-700" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">İleri vade planı</h3>
                <p className="text-[10px] text-gray-500 capitalize">
                  {formatMonthLabel(selectedMonth)} itibarıyla · kalan vade × taksit
                </p>
              </div>
            </div>
            <button type="button" onClick={() => openNewFuture()} className="btn-secondary px-2 py-1.5 text-xs">
              <Plus size={14} />
              Vade ekle
            </button>
          </div>

          {scheduleRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Planlanacak vade yok.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Ay</th>
                      <th className="px-3 py-2 font-semibold">Banka</th>
                      <th className="px-3 py-2 font-semibold">Tutar</th>
                      <th className="px-3 py-2 font-semibold">Tür</th>
                      <th className="px-3 py-2 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {scheduleRows.map((row) => (
                        <tr key={row.id} className={row.paid ? 'bg-brand-50/40' : ''}>
                          <td className="px-3 py-2 font-medium capitalize">
                            {formatMonthLabel(row.month)}
                          </td>
                          <td className="px-3 py-2">{row.bankName}</td>
                          <td
                            className={`px-3 py-2 font-semibold ${row.paid ? 'text-brand-700 line-through' : 'money-negative'}`}
                          >
                            {formatMoney(row.amount)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                row.source === 'manual'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {row.source === 'manual' ? 'Manuel' : 'Otomatik'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {row.source === 'manual' ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  className="btn-danger p-1"
                                  onClick={() =>
                                    openEditFuture(row.loanId, {
                                      id: row.id,
                                      month: row.month,
                                      amount: row.amount,
                                      note: row.note,
                                      paid: row.paid,
                                    })
                                  }
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger p-1"
                                  onClick={() => removeFutureInstallment(row.loanId, row.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 bg-gray-50 px-3 py-3 text-[10px]">
                <div>
                  <p className="text-gray-500">Toplam plan</p>
                  <p className="font-bold text-gray-900">{formatMoney(totals.total)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ödenen</p>
                  <p className="font-bold text-brand-700">{formatMoney(totals.paid)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kalan</p>
                  <p className="font-bold text-danger">{formatMoney(totals.remaining)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <Modal open={open} title={editing ? 'Krediyi Düzenle' : 'Kredi Ekle'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Banka adı *</label>
            <input
              className="field-input"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              placeholder="Örn. Ziraat, Yapı Kredi"
              required
            />
          </div>
          <MoneyInput
            label="Aylık ödeme (vade tutarı)"
            value={form.monthlyPayment}
            onChange={(v) => setForm((f) => ({ ...f, monthlyPayment: v }))}
            required
          />
          <div>
            <label className="field-label">İlk taksit ayı *</label>
            <input
              type="month"
              className="field-input"
              value={form.startMonth || selectedMonth}
              onChange={(e) => setForm((f) => ({ ...f, startMonth: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Toplam vade (ay) *</label>
              <input
                type="number"
                min="1"
                className="field-input"
                value={form.totalTerms}
                onChange={(e) => setForm((f) => ({ ...f, totalTerms: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="field-label">Kalan taksit (ay) *</label>
              <input
                type="number"
                min="0"
                className="field-input"
                value={form.remainingTerms}
                onChange={(e) => setForm((f) => ({ ...f, remainingTerms: e.target.value }))}
                required
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Bu aydan itibaren ödenecek taksit sayısı
              </p>
            </div>
          </div>
          <MoneyInput
            label="Kapama tutarı"
            value={form.payoffAmount}
            onChange={(v) => setForm((f) => ({ ...f, payoffAmount: v }))}
            required
          />
          <div className="border-t border-gray-100 pt-4">
            <PaidToggle
              label="Taksit ödendi"
              checked={form.installmentPaid}
              onChange={(v) => setForm((f) => ({ ...f, installmentPaid: v }))}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Kaydet
          </button>
        </form>
      </Modal>

      <Modal
        open={futureOpen}
        title={editingFuture ? 'İleri vadeyi düzenle' : 'İleri vade ekle'}
        onClose={() => setFutureOpen(false)}
      >
        <form onSubmit={saveFutureInstallment} className="space-y-4">
          <div>
            <label className="field-label">Kredi *</label>
            <select
              className="field-input"
              value={futureForm.loanId}
              onChange={(e) => {
                const loan = state.loans.find((l) => l.id === e.target.value)
                setFutureForm((f) => ({
                  ...f,
                  loanId: e.target.value,
                  amount: loan?.monthlyPayment ?? f.amount,
                }))
              }}
              required
            >
              <option value="">Seçin</option>
              {state.loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.bankName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Vade ayı *</label>
            <input
              type="month"
              className="field-input"
              value={futureForm.month}
              onChange={(e) => setFutureForm((f) => ({ ...f, month: e.target.value }))}
              required
            />
          </div>
          <MoneyInput
            label="Taksit tutarı"
            value={futureForm.amount}
            onChange={(v) => setFutureForm((f) => ({ ...f, amount: v }))}
            required
          />
          <div>
            <label className="field-label">Not</label>
            <input
              className="field-input"
              value={futureForm.note}
              onChange={(e) => setFutureForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="İsteğe bağlı"
            />
          </div>
          <PaidToggle
            label="Ödendi"
            checked={futureForm.paid}
            onChange={(v) => setFutureForm((f) => ({ ...f, paid: v }))}
          />
          <button type="submit" className="btn-primary w-full">
            Kaydet
          </button>
        </form>
      </Modal>
    </div>
  )
}
