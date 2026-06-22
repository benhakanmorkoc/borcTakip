import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { buildMonthlyReport } from '../lib/report'
import { formatMoney, formatMonthLabel, currentYearMonth } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'
import PaidToggle from '../components/PaidToggle'
import PageSummary from '../components/PageSummary'

const emptyForm = () => ({
  bankName: '',
  minPayment: 0,
  totalDebt: 0,
  dueMonth: currentYearMonth(),
  minPaid: false,
  fullyPaid: false,
})

export default function CreditCards() {
  const { state, selectedMonth, addCreditCard, updateCreditCard, removeCreditCard } = useFinance()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const monthlyTotal = useMemo(() => {
    const report = buildMonthlyReport(state, selectedMonth)
    return report.totalCardMinPayment
  }, [state, selectedMonth])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  const openEdit = (card) => {
    setEditing(card.id)
    setForm({
      bankName: card.bankName,
      minPayment: card.minPayment,
      totalDebt: card.totalDebt,
      dueMonth: card.dueMonth,
      minPaid: Boolean(card.minPaid),
      fullyPaid: Boolean(card.fullyPaid),
    })
    setOpen(true)
  }

  const toggleField = (id, field, value) => {
    const patch = { [field]: value }
    if (field === 'fullyPaid' && value) patch.minPaid = true
    if (field === 'minPaid' && !value) patch.fullyPaid = false
    updateCreditCard(id, patch)
  }

  const setFormPaid = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'fullyPaid' && value) next.minPaid = true
      if (field === 'minPaid' && !value) next.fullyPaid = false
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.bankName.trim()) return
    if (editing) updateCreditCard(editing, form)
    else addCreditCard(form)
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <PageSummary monthlyLabel="Bu ay kart min. ödeme" monthlyAmount={monthlyTotal} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Kredi Kartları</h2>
          <p className="text-sm text-gray-500">Banka, minimum ödeme ve toplam borç</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary px-3 py-2">
          <Plus size={18} />
          Ekle
        </button>
      </div>

      {state.creditCards.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Henüz kredi kartı eklenmedi.</div>
      ) : (
        <ul className="space-y-3">
          {state.creditCards.map((card) => (
            <li key={card.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{card.bankName}</p>
                  <p className="text-xs text-gray-500 capitalize">{formatMonthLabel(card.dueMonth)} ödemesi</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openEdit(card)} className="btn-danger">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => removeCreditCard(card.id)} className="btn-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className={`rounded-xl p-3 ${card.minPaid || card.fullyPaid ? 'bg-brand-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">Min. ödeme</p>
                  <p className={`font-semibold ${card.minPaid || card.fullyPaid ? 'text-brand-700 line-through' : 'money-negative'}`}>
                    {formatMoney(card.minPayment)}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${card.fullyPaid ? 'bg-brand-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500">Toplam borç</p>
                  <p className={`font-semibold ${card.fullyPaid ? 'text-brand-700 line-through' : ''}`}>
                    {formatMoney(card.totalDebt)}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <PaidToggle
                  label="Asgari tutar ödendi"
                  checked={Boolean(card.minPaid || card.fullyPaid)}
                  disabled={Boolean(card.fullyPaid)}
                  onChange={(v) => toggleField(card.id, 'minPaid', v)}
                />
                <PaidToggle
                  label="Tamamı ödendi"
                  checked={Boolean(card.fullyPaid)}
                  onChange={(v) => toggleField(card.id, 'fullyPaid', v)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} title={editing ? 'Kartı Düzenle' : 'Kredi Kartı Ekle'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Banka adı *</label>
            <input
              className="field-input"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              placeholder="Örn. Garanti, İş Bankası"
              required
            />
          </div>
          <div>
            <label className="field-label">Ödeme ayı *</label>
            <input
              type="month"
              className="field-input"
              value={form.dueMonth}
              onChange={(e) => setForm((f) => ({ ...f, dueMonth: e.target.value }))}
              required
            />
          </div>
          <MoneyInput
            label="Minimum ödeme tutarı"
            value={form.minPayment}
            onChange={(v) => setForm((f) => ({ ...f, minPayment: v }))}
            required
          />
          <MoneyInput
            label="Toplam borç"
            value={form.totalDebt}
            onChange={(v) => setForm((f) => ({ ...f, totalDebt: v }))}
            required
          />
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ödeme durumu</p>
            <PaidToggle
              label="Asgari tutar ödendi"
              checked={form.minPaid || form.fullyPaid}
              disabled={form.fullyPaid}
              onChange={(v) => setFormPaid('minPaid', v)}
            />
            <PaidToggle
              label="Tamamı ödendi"
              checked={form.fullyPaid}
              onChange={(v) => setFormPaid('fullyPaid', v)}
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
