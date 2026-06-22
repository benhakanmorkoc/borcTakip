import {
  DEFAULT_INCOME_TYPES,
  DEFAULT_PAYMENT_TYPES,
  emptyState,
  loadState,
} from './storage'
import { supabase } from './supabase'

function fromCreditCard(row) {
  return {
    id: row.id,
    bankName: row.bank_name,
    minPayment: Number(row.min_payment) || 0,
    totalDebt: Number(row.total_debt) || 0,
    dueMonth: row.due_month,
    minPaid: Boolean(row.min_paid),
    fullyPaid: Boolean(row.fully_paid),
  }
}

function toCreditCard(row, userId) {
  return {
    user_id: userId,
    bank_name: row.bankName,
    min_payment: row.minPayment ?? 0,
    total_debt: row.totalDebt ?? 0,
    due_month: row.dueMonth,
    min_paid: Boolean(row.minPaid),
    fully_paid: Boolean(row.fullyPaid),
  }
}

function fromLoan(row) {
  return {
    id: row.id,
    bankName: row.bank_name,
    monthlyPayment: Number(row.monthly_payment) || 0,
    totalTerms: Number(row.total_terms) || 1,
    remainingTerms: Number(row.remaining_terms) || 0,
    payoffAmount: Number(row.payoff_amount) || 0,
    installmentPaid: Boolean(row.installment_paid),
  }
}

function toLoan(row, userId) {
  return {
    user_id: userId,
    bank_name: row.bankName,
    monthly_payment: row.monthlyPayment ?? 0,
    total_terms: row.totalTerms ?? 1,
    remaining_terms: row.remainingTerms ?? 1,
    payoff_amount: row.payoffAmount ?? 0,
    installment_paid: Boolean(row.installmentPaid),
  }
}

function fromOtherPayment(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name || '',
    amount: Number(row.amount) || 0,
    dueDate: row.due_date,
    note: row.note || '',
    paid: Boolean(row.paid),
  }
}

function toOtherPayment(row, userId) {
  return {
    user_id: userId,
    type: row.type,
    name: row.name || null,
    amount: row.amount ?? 0,
    due_date: row.dueDate,
    note: row.note || null,
    paid: Boolean(row.paid),
  }
}

function fromIncome(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name || '',
    amount: Number(row.amount) || 0,
    month: row.month,
  }
}

function toIncome(row, userId) {
  return {
    user_id: userId,
    type: row.type,
    name: row.name || null,
    amount: row.amount ?? 0,
    month: row.month,
  }
}

function isEmptyFinance(state) {
  return (
    !state.creditCards.length &&
    !state.loans.length &&
    !state.otherPayments.length &&
    !state.incomes.length
  )
}

async function seedDefaultTypes(userId) {
  const rows = [
    ...DEFAULT_PAYMENT_TYPES.map((label) => ({ user_id: userId, category: 'payment', label })),
    ...DEFAULT_INCOME_TYPES.map((label) => ({ user_id: userId, category: 'income', label })),
  ]
  const { error } = await supabase.from('custom_types').upsert(rows, {
    onConflict: 'user_id,category,label',
    ignoreDuplicates: true,
  })
  if (error) throw error
}

export async function fetchFinanceState(userId) {
  const [cards, loans, payments, incomes, types] = await Promise.all([
    supabase.from('credit_cards').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('loans').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('other_payments').select('*').eq('user_id', userId).order('due_date'),
    supabase.from('incomes').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('custom_types').select('*').eq('user_id', userId),
  ])

  for (const res of [cards, loans, payments, incomes, types]) {
    if (res.error) throw res.error
  }

  let paymentTypes = types.data.filter((t) => t.category === 'payment').map((t) => t.label)
  let incomeTypes = types.data.filter((t) => t.category === 'income').map((t) => t.label)

  if (!paymentTypes.length && !incomeTypes.length) {
    await seedDefaultTypes(userId)
    paymentTypes = [...DEFAULT_PAYMENT_TYPES]
    incomeTypes = [...DEFAULT_INCOME_TYPES]
  } else {
    if (!paymentTypes.length) paymentTypes = [...DEFAULT_PAYMENT_TYPES]
    if (!incomeTypes.length) incomeTypes = [...DEFAULT_INCOME_TYPES]
  }

  return {
    creditCards: cards.data.map(fromCreditCard),
    loans: loans.data.map(fromLoan),
    otherPayments: payments.data.map(fromOtherPayment),
    incomes: incomes.data.map(fromIncome),
    paymentTypes,
    incomeTypes,
  }
}

export async function migrateLocalToSupabase(userId) {
  const local = loadState()
  if (isEmptyFinance(local)) return fetchFinanceState(userId)

  for (const card of local.creditCards) {
    const { error } = await supabase.from('credit_cards').insert(toCreditCard(card, userId))
    if (error) throw error
  }
  for (const loan of local.loans) {
    const { error } = await supabase.from('loans').insert(toLoan(loan, userId))
    if (error) throw error
  }
  for (const payment of local.otherPayments) {
    const { error } = await supabase.from('other_payments').insert(toOtherPayment(payment, userId))
    if (error) throw error
  }
  for (const income of local.incomes) {
    const { error } = await supabase.from('incomes').insert(toIncome(income, userId))
    if (error) throw error
  }

  const typeRows = [
    ...local.paymentTypes.map((label) => ({ user_id: userId, category: 'payment', label })),
    ...local.incomeTypes.map((label) => ({ user_id: userId, category: 'income', label })),
  ]
  if (typeRows.length) {
    await supabase.from('custom_types').upsert(typeRows, {
      onConflict: 'user_id,category,label',
      ignoreDuplicates: true,
    })
  }

  localStorage.removeItem('borc-takip-data-v1')
  return fetchFinanceState(userId)
}

export async function loadFinanceForUser(userId) {
  const remote = await fetchFinanceState(userId)
  if (isEmptyFinance(remote)) {
    const local = loadState()
    if (!isEmptyFinance(local)) {
      return migrateLocalToSupabase(userId)
    }
  }
  return remote
}

export const financeApi = {
  async insertCreditCard(userId, data) {
    const { data: row, error } = await supabase
      .from('credit_cards')
      .insert(toCreditCard(data, userId))
      .select()
      .single()
    if (error) throw error
    return fromCreditCard(row)
  },

  async updateCreditCard(id, data) {
    const { data: row, error } = await supabase
      .from('credit_cards')
      .update({
        bank_name: data.bankName,
        min_payment: data.minPayment ?? 0,
        total_debt: data.totalDebt ?? 0,
        due_month: data.dueMonth,
        min_paid: Boolean(data.minPaid),
        fully_paid: Boolean(data.fullyPaid),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return fromCreditCard(row)
  },

  async deleteCreditCard(id) {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id)
    if (error) throw error
  },

  async insertLoan(userId, data) {
    const { data: row, error } = await supabase
      .from('loans')
      .insert(toLoan(data, userId))
      .select()
      .single()
    if (error) throw error
    return fromLoan(row)
  },

  async updateLoan(id, data) {
    const { data: row, error } = await supabase
      .from('loans')
      .update({
        bank_name: data.bankName,
        monthly_payment: data.monthlyPayment ?? 0,
        total_terms: data.totalTerms ?? 1,
        remaining_terms: data.remainingTerms ?? 0,
        payoff_amount: data.payoffAmount ?? 0,
        installment_paid: Boolean(data.installmentPaid),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return fromLoan(row)
  },

  async deleteLoan(id) {
    const { error } = await supabase.from('loans').delete().eq('id', id)
    if (error) throw error
  },

  async insertOtherPayment(userId, data) {
    const { data: row, error } = await supabase
      .from('other_payments')
      .insert(toOtherPayment(data, userId))
      .select()
      .single()
    if (error) throw error
    return fromOtherPayment(row)
  },

  async updateOtherPayment(id, data) {
    const { data: row, error } = await supabase
      .from('other_payments')
      .update({
        type: data.type,
        name: data.name || null,
        amount: data.amount ?? 0,
        due_date: data.dueDate,
        note: data.note || null,
        paid: Boolean(data.paid),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return fromOtherPayment(row)
  },

  async deleteOtherPayment(id) {
    const { error } = await supabase.from('other_payments').delete().eq('id', id)
    if (error) throw error
  },

  async insertIncome(userId, data) {
    const { data: row, error } = await supabase
      .from('incomes')
      .insert(toIncome(data, userId))
      .select()
      .single()
    if (error) throw error
    return fromIncome(row)
  },

  async updateIncome(id, data) {
    const { data: row, error } = await supabase
      .from('incomes')
      .update({
        type: data.type,
        name: data.name || null,
        amount: data.amount ?? 0,
        month: data.month,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return fromIncome(row)
  },

  async deleteIncome(id) {
    const { error } = await supabase.from('incomes').delete().eq('id', id)
    if (error) throw error
  },

  async insertCustomType(userId, category, label) {
    const { error } = await supabase
      .from('custom_types')
      .upsert({ user_id: userId, category, label }, { onConflict: 'user_id,category,label' })
    if (error) throw error
  },
}
