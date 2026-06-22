import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { buildMonthlyReport } from '../lib/report'
import { isNegativeBalancePayment, isNegativeBalanceType } from '../lib/paymentCategories'
import { formatDate, formatMoney } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'
import PaidToggle from '../components/PaidToggle'
import PageSummary from '../components/PageSummary'

const emptyForm = (types) => ({
  type: types[0] || 'Diğer',
  name: '',
  amount: 0,
  dueDate: new Date().toISOString().slice(0, 10),
  note: '',
  paid: false,
  isNegativeBalance: false,
})

export default function OtherPayments() {
  const { state, selectedMonth, addOtherPayment, updateOtherPayment, removeOtherPayment, addPaymentType } =
    useFinance()
  const [open, setOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [newType, setNewType] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm(state.paymentTypes))

  const monthlyTotal = useMemo(() => {
    const report = buildMonthlyReport(state, selectedMonth)
    return report.totalOtherPayment
  }, [state, selectedMonth])

  const sorted = [...state.otherPayments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm(state.paymentTypes))
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item.id)
    setForm({
      type: item.type,
      name: item.name,
      amount: item.amount,
      dueDate: item.dueDate,
      note: item.note || '',
      paid: Boolean(item.paid),
      isNegativeBalance: Boolean(item.isNegativeBalance) || isNegativeBalancePayment(item),
    })
    setOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateOtherPayment(editing, form)
    else addOtherPayment(form)
    setOpen(false)
  }

  const handleAddType = (e) => {
    e.preventDefault()
    if (!newType.trim()) return
    addPaymentType(newType)
    setForm((f) => ({ ...f, type: newType.trim() }))
    setNewType('')
    setTypeOpen(false)
  }

  return (
    <div className="space-y-4">
      <PageSummary monthlyLabel="Bu ay diğer ödeme" monthlyAmount={monthlyTotal} />

      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Diğer Ödemeler</h2>
          <p className="text-sm text-gray-500">Okul, kur taksidi ve özel kalemler</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTypeOpen(true)} className="btn-secondary px-3 py-2">
            <Tag size={16} />
          </button>
          <button type="button" onClick={openNew} className="btn-primary px-3 py-2">
            <Plus size={18} />
            Ekle
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {state.paymentTypes.map((t) => (
          <span key={t} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm border border-gray-100">
            {t}
          </span>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Henüz ödeme eklenmedi.</div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((item) => (
            <li key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{item.type}</p>
                  <p className="font-bold text-gray-900">{item.name || item.type}</p>
                  {(item.isNegativeBalance || isNegativeBalancePayment(item)) && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Negatif bakiye
                    </span>
                  )}
                  <p className="text-xs text-gray-500">Vade: {formatDate(item.dueDate)}</p>
                </div>
                <div className="flex items-start gap-2">
                  <p className={`font-semibold ${item.paid ? 'text-brand-700 line-through' : 'money-negative'}`}>
                    {formatMoney(item.amount)}
                  </p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(item)} className="btn-danger">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => removeOtherPayment(item.id)} className="btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {item.note && <p className="mt-2 text-xs text-gray-500">{item.note}</p>}
              <div className="mt-3">
                <PaidToggle
                  label="Ödendi"
                  checked={Boolean(item.paid)}
                  onChange={(v) => updateOtherPayment(item.id, { paid: v })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} title={editing ? 'Ödemeyi Düzenle' : 'Ödeme Ekle'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Ödeme tipi *</label>
            <select
              className="field-input"
              value={form.type}
              onChange={(e) => {
                const type = e.target.value
                setForm((f) => ({
                  ...f,
                  type,
                  isNegativeBalance: isNegativeBalanceType(type) ? true : f.isNegativeBalance,
                }))
              }}
            >
              {state.paymentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Açıklama</label>
            <input
              className="field-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Örn. Ahmet okul ücreti"
            />
          </div>
          <MoneyInput
            label="Tutar"
            value={form.amount}
            onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
            required
          />
          <div>
            <label className="field-label">Vade tarihi *</label>
            <input
              type="date"
              className="field-input"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="field-label">Not</label>
            <textarea
              className="field-input min-h-[72px] resize-none"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="İsteğe bağlı"
            />
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <PaidToggle
              label="Negatif bakiye kalemi"
              checked={Boolean(form.isNegativeBalance)}
              onChange={(v) => setForm((f) => ({ ...f, isNegativeBalance: v }))}
            />
            <PaidToggle
              label="Ödendi"
              checked={form.paid}
              onChange={(v) => setForm((f) => ({ ...f, paid: v }))}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Kaydet
          </button>
        </form>
      </Modal>

      <Modal open={typeOpen} title="Yeni Ödeme Tipi" onClose={() => setTypeOpen(false)}>
        <form onSubmit={handleAddType} className="space-y-4">
          <div>
            <label className="field-label">Tip adı</label>
            <input
              className="field-input"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Örn. Spor Kulübü"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Tip Ekle
          </button>
        </form>
      </Modal>
    </div>
  )
}
