import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { buildMonthlyReport } from '../lib/report'
import { formatMoney } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'
import PaidToggle from '../components/PaidToggle'
import PageSummary from '../components/PageSummary'

const emptyForm = () => ({
  bankName: '',
  monthlyPayment: 0,
  totalTerms: 12,
  remainingTerms: 12,
  payoffAmount: 0,
  installmentPaid: false,
})

export default function Loans() {
  const { state, selectedMonth, addLoan, updateLoan, removeLoan } = useFinance()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const monthlyTotal = useMemo(() => {
    const report = buildMonthlyReport(state, selectedMonth)
    return report.totalLoanInstallment
  }, [state, selectedMonth])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm())
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
    })
    setOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.bankName.trim()) return
    const totalTerms = Math.max(1, Number(form.totalTerms) || 1)
    const remainingTerms = Math.min(
      totalTerms,
      Math.max(0, Number(form.remainingTerms) || 0)
    )
    const payload = { ...form, totalTerms, remainingTerms }
    if (editing) updateLoan(editing, payload)
    else addLoan(payload)
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <PageSummary monthlyLabel="Bu ay kredi taksit" monthlyAmount={monthlyTotal} />

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
            const remainingTerms = Number(loan.remainingTerms) || 0
            return (
              <li key={loan.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{loan.bankName}</p>
                    <p className="text-xs text-gray-500">
                      {remainingTerms} / {totalTerms} ay kaldı
                    </p>
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
                    <p className={`font-semibold ${loan.installmentPaid ? 'text-brand-700 line-through' : 'money-negative'}`}>
                      {formatMoney(loan.monthlyPayment)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Kapama tutarı</p>
                    <p className="font-semibold">{formatMoney(loan.payoffAmount)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <PaidToggle
                    label="Taksit ödendi"
                    checked={Boolean(loan.installmentPaid)}
                    onChange={(v) => updateLoan(loan.id, { installmentPaid: v })}
                  />
                </div>
              </li>
            )
          })}
        </ul>
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
            label="Aylık ödeme"
            value={form.monthlyPayment}
            onChange={(v) => setForm((f) => ({ ...f, monthlyPayment: v }))}
            required
          />
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
              <label className="field-label">Kalan vade (ay) *</label>
              <input
                type="number"
                min="0"
                className="field-input"
                value={form.remainingTerms}
                onChange={(e) => setForm((f) => ({ ...f, remainingTerms: e.target.value }))}
                required
              />
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
    </div>
  )
}
