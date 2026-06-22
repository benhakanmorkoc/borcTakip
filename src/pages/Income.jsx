import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { buildHomeReport } from '../lib/report'
import { formatMoney, formatMonthLabel, currentYearMonth } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'
import PageSummary from '../components/PageSummary'

const emptyForm = (types) => ({
  type: types[0] || 'Maaş',
  name: '',
  amount: 0,
  month: currentYearMonth(),
})

export default function Income() {
  const { state, selectedMonth, addIncome, updateIncome, removeIncome, addIncomeType } = useFinance()
  const [open, setOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [newType, setNewType] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm(state.incomeTypes))

  const cariAy = currentYearMonth()

  const monthIncomes = state.incomes.filter((i) => i.month === selectedMonth)

  const incomeSummary = useMemo(() => {
    const report = buildHomeReport(state, selectedMonth, cariAy)
    return {
      income: report.totalIncome,
      expenses: report.totalMinAmount,
      balance: report.incomeBalance,
      isProjected: report.isProjected,
      projectedFrom: report.projectedFrom,
    }
  }, [state, selectedMonth, cariAy])

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm(state.incomeTypes), month: selectedMonth })
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item.id)
    setForm({
      type: item.type,
      name: item.name,
      amount: item.amount,
      month: item.month,
    })
    setOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateIncome(editing, form)
    else addIncome(form)
    setOpen(false)
  }

  const handleAddType = (e) => {
    e.preventDefault()
    if (!newType.trim()) return
    addIncomeType(newType)
    setForm((f) => ({ ...f, type: newType.trim() }))
    setNewType('')
    setTypeOpen(false)
  }

  return (
    <div className="space-y-4">
      <PageSummary
        isProjected={incomeSummary.isProjected}
        projectedFrom={incomeSummary.projectedFrom}
        fields={[
          { label: 'Bu ay toplam gelir', value: incomeSummary.income, tone: 'positive' },
          { label: 'Giderler toplamı', value: incomeSummary.expenses, tone: 'negative' },
          {
            label: 'Aylık bakiye',
            value: incomeSummary.balance,
            tone: incomeSummary.balance >= 0 ? 'positive' : 'negative',
          },
        ]}
      />

      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gelirler</h2>
          <p className="text-sm text-gray-500 capitalize">{formatMonthLabel(selectedMonth)}</p>
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
        {state.incomeTypes.map((t) => (
          <span key={t} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm border border-gray-100">
            {t}
          </span>
        ))}
      </div>

      {monthIncomes.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          Bu ay için gelir kaydı yok. Özet sekmesinden ay değiştirebilirsiniz.
        </div>
      ) : (
        <ul className="space-y-3">
          {monthIncomes.map((item) => (
            <li key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{item.type}</p>
                  <p className="font-bold text-gray-900">{item.name || item.type}</p>
                </div>
                <div className="flex items-start gap-2">
                  <p className="money-positive font-semibold">+{formatMoney(item.amount)}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(item)} className="btn-danger">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => removeIncome(item.id)} className="btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} title={editing ? 'Geliri Düzenle' : 'Gelir Ekle'} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Gelir tipi *</label>
            <select
              className="field-input"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {state.incomeTypes.map((t) => (
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
              placeholder="Örn. Ana maaş, freelance"
            />
          </div>
          <MoneyInput
            label="Tutar"
            value={form.amount}
            onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
            required
          />
          <div>
            <label className="field-label">Ay *</label>
            <input
              type="month"
              className="field-input"
              value={form.month}
              onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Kaydet
          </button>
        </form>
      </Modal>

      <Modal open={typeOpen} title="Yeni Gelir Tipi" onClose={() => setTypeOpen(false)}>
        <form onSubmit={handleAddType} className="space-y-4">
          <div>
            <label className="field-label">Tip adı</label>
            <input
              className="field-input"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Örn. Temettü"
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
