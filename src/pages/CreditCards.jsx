import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Info } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { buildCreditCardsForMonth, buildHomeReport, isProjectedCard } from '../lib/report'
import { formatMoney, formatMonthLabel, currentYearMonth } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'
import PaidToggle from '../components/PaidToggle'
import PageSummary from '../components/PageSummary'

const emptyForm = (dueMonth) => ({
  bankName: '',
  minPayment: 0,
  totalDebt: 0,
  dueMonth: dueMonth || currentYearMonth(),
  minPaid: false,
  fullyPaid: false,
})

export default function CreditCards() {
  const {
    state,
    selectedMonth,
    addCreditCard,
    updateCreditCard,
    removeCreditCard,
    dismissProjectedCard,
  } = useFinance()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [projectingFromId, setProjectingFromId] = useState(null)
  const [form, setForm] = useState(() => emptyForm())

  const cariAy = currentYearMonth()

  const cardView = useMemo(
    () => buildCreditCardsForMonth(state, selectedMonth, cariAy),
    [state, selectedMonth, cariAy]
  )

  const monthlyTotal = useMemo(() => {
    const report = buildHomeReport(state, selectedMonth, cariAy)
    return report.totalCardMinGross
  }, [state, selectedMonth, cariAy])

  const openNew = () => {
    setEditing(null)
    setProjectingFromId(null)
    setForm(emptyForm(selectedMonth))
    setOpen(true)
  }

  const openEdit = (card) => {
    if (isProjectedCard(card)) {
      setEditing(null)
      setProjectingFromId(card.sourceCardId || null)
      setForm({
        bankName: card.bankName,
        minPayment: card.minPayment,
        totalDebt: card.totalDebt,
        dueMonth: selectedMonth,
        minPaid: false,
        fullyPaid: false,
      })
      setOpen(true)
      return
    }
    setProjectingFromId(null)
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
    if (editing) {
      updateCreditCard(editing, form)
    } else {
      addCreditCard({
        ...form,
        dueMonth: form.dueMonth || selectedMonth,
        projectedFromCardId: projectingFromId || undefined,
      })
    }
    setProjectingFromId(null)
    setOpen(false)
  }

  const { cards, isProjected, projectedFrom } = cardView

  return (
    <div className="space-y-4">
      <PageSummary
        monthlyLabel="Bu ay kart min. ödeme"
        monthlyAmount={monthlyTotal}
        isProjected={isProjected}
        projectedFrom={projectedFrom}
      />

      {isProjected && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            <strong>Tahmini</strong> — {formatMonthLabel(projectedFrom)} kartları kopyalandı. Ödeme
            işaretleri kapalı. Düzenlediğiniz kart gerçek kayda dönüşür; diğerleri tahmini kalır.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Kredi Kartları</h2>
          <p className="text-sm text-gray-500 capitalize">
            {formatMonthLabel(selectedMonth)} · banka, minimum ödeme ve toplam borç
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary px-3 py-2">
          <Plus size={18} />
          Ekle
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          {state.creditCards.length === 0
            ? 'Henüz kredi kartı eklenmedi.'
            : `${formatMonthLabel(selectedMonth)} için kart kaydı yok.`}
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => {
            const projected = isProjectedCard(card)
            const minPaid = projected ? false : Boolean(card.minPaid || card.fullyPaid)
            const fullyPaid = projected ? false : Boolean(card.fullyPaid)
            return (
              <li
                key={card.id}
                className={`card p-4 ${projected ? 'border border-dashed border-blue-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{card.bankName}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {formatMonthLabel(card.dueMonth)} ödemesi
                      {projected && (
                        <span className="ml-1 font-medium text-blue-600">· tahmini</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(card)} className="btn-danger">
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        projected
                          ? dismissProjectedCard(card.sourceCardId, selectedMonth)
                          : removeCreditCard(card.id)
                      }
                      className="btn-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className={`rounded-xl p-3 ${minPaid ? 'bg-brand-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-500">Min. ödeme</p>
                    <p
                      className={`font-semibold ${minPaid ? 'text-brand-700 line-through' : 'money-negative'}`}
                    >
                      {formatMoney(card.minPayment)}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${fullyPaid ? 'bg-brand-50' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-500">Toplam borç</p>
                    <p className={`font-semibold ${fullyPaid ? 'text-brand-700 line-through' : ''}`}>
                      {formatMoney(card.totalDebt)}
                    </p>
                  </div>
                </div>
                {!projected && (
                  <div className="mt-3 space-y-2">
                    <PaidToggle
                      label="Asgari tutar ödendi"
                      checked={minPaid}
                      disabled={fullyPaid}
                      onChange={(v) => toggleField(card.id, 'minPaid', v)}
                    />
                    <PaidToggle
                      label="Tamamı ödendi"
                      checked={fullyPaid}
                      onChange={(v) => toggleField(card.id, 'fullyPaid', v)}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={open}
        title={editing ? 'Kartı Düzenle' : projectingFromId ? 'Tahmini kartı kaydet' : 'Kredi Kartı Ekle'}
        onClose={() => {
          setProjectingFromId(null)
          setOpen(false)
        }}
      >
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
