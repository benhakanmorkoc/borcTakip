import {
  compareYearMonth,
  currentYearMonth,
  formatMoney,
  monthDiff,
  shiftYearMonth,
  yearMonthFromDate,
} from './format'

function creditCardDueAmount(card) {
  if (card.fullyPaid || card.minPaid) return 0
  return Number(card.minPayment) || 0
}

function loanDueAmountForMonth(loan, yearMonth, referenceMonth) {
  const diff = monthDiff(referenceMonth, yearMonth)
  if (diff < 0) return 0
  const effectiveRemaining = (Number(loan.remainingTerms) || 0) - diff
  if (effectiveRemaining <= 0) return 0
  if (diff === 0 && loan.installmentPaid) return 0
  return Number(loan.monthlyPayment) || 0
}

function otherDueAmount(payment) {
  if (payment.paid) return 0
  return Number(payment.amount) || 0
}

function paidLabel(card) {
  if (card.fullyPaid) return 'Tamamı ödendi'
  if (card.minPaid) return 'Asgari ödendi'
  return null
}

export function buildMonthlyReport(state, yearMonth, referenceMonth = currentYearMonth()) {
  const creditCardItems = state.creditCards
    .filter((c) => c.dueMonth === yearMonth)
    .map((c) => {
      const dueAmount = creditCardDueAmount(c)
      return {
        id: c.id,
        category: 'Kredi Kartı',
        label: c.bankName,
        amount: Number(c.minPayment) || 0,
        dueAmount,
        paid: Boolean(c.fullyPaid || c.minPaid),
        paidLabel: paidLabel(c),
        detail: `Toplam borç: ${formatMoney(c.totalDebt)}`,
        sortKey: 1,
      }
    })

  const loanItems = state.loans.map((l) => {
    const totalTerms = Number(l.totalTerms) || Number(l.remainingTerms) || 1
    const remainingTerms = Number(l.remainingTerms) || 0
    const dueAmount = loanDueAmountForMonth(l, yearMonth, referenceMonth)
    const isCurrentMonth = yearMonth === referenceMonth
    return {
      id: l.id,
      category: 'Banka Kredisi',
      label: l.bankName,
      amount: Number(l.monthlyPayment) || 0,
      dueAmount,
      paid: isCurrentMonth && Boolean(l.installmentPaid),
      paidLabel: isCurrentMonth && l.installmentPaid ? 'Taksit ödendi' : null,
      detail: `Vade: ${totalTerms} ay · Kalan: ${remainingTerms} ay · Kapama: ${formatMoney(l.payoffAmount)}`,
      sortKey: 2,
    }
  })

  const otherItems = state.otherPayments
    .filter((p) => yearMonthFromDate(p.dueDate) === yearMonth)
    .map((p) => ({
      id: p.id,
      category: p.type,
      label: p.name || p.type,
      amount: Number(p.amount) || 0,
      dueAmount: otherDueAmount(p),
      paid: Boolean(p.paid),
      paidLabel: p.paid ? 'Ödendi' : null,
      detail: p.dueDate,
      sortKey: 3,
    }))

  const incomeItems = state.incomes
    .filter((i) => i.month === yearMonth)
    .map((i) => ({
      id: i.id,
      category: i.type,
      label: i.name || i.type,
      amount: Number(i.amount) || 0,
      sortKey: 4,
    }))

  const allExpenses = [...creditCardItems, ...loanItems, ...otherItems]
  const totalCardMinPayment = creditCardItems.reduce((s, i) => s + i.dueAmount, 0)
  const totalCardPayoff = state.creditCards.reduce(
    (s, c) => s + (c.fullyPaid ? 0 : Number(c.totalDebt) || 0),
    0
  )
  const totalLoanInstallment = loanItems.reduce((s, i) => s + i.dueAmount, 0)
  const totalLoanPayoff = state.loans.reduce((s, l) => s + (Number(l.payoffAmount) || 0), 0)
  const totalOtherPayment = otherItems.reduce((s, i) => s + i.dueAmount, 0)

  const totalExpenses = totalCardMinPayment + totalLoanInstallment + totalOtherPayment
  const totalPaidExpenses = allExpenses.reduce((s, i) => s + (i.paid ? i.amount : 0), 0)

  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0)
  const balance = totalIncome - totalExpenses

  return {
    yearMonth,
    expenses: allExpenses,
    incomes: incomeItems,
    totalCardMinPayment,
    totalCardPayoff,
    totalLoanInstallment,
    totalLoanPayoff,
    totalOtherPayment,
    totalExpenses,
    totalPaidExpenses,
    totalIncome,
    balance,
    totalDebt: totalCardPayoff,
    totalLoanPayoff,
    grandTotalDebt: totalCardPayoff + totalLoanPayoff,
  }
}

function collectMonthsFromState(state, referenceMonth) {
  const months = new Set([referenceMonth])

  state.creditCards.forEach((c) => c.dueMonth && months.add(c.dueMonth))
  state.incomes.forEach((i) => i.month && months.add(i.month))
  state.otherPayments.forEach((p) => {
    const ym = yearMonthFromDate(p.dueDate)
    if (ym) months.add(ym)
  })

  const maxLoanTerms = Math.max(0, ...state.loans.map((l) => Number(l.remainingTerms) || 0))
  for (let i = 0; i <= maxLoanTerms; i++) {
    months.add(shiftYearMonth(referenceMonth, i))
  }

  return [...months].sort(compareYearMonth)
}

export function buildChartMonths(state, referenceMonth = currentYearMonth()) {
  const sorted = collectMonthsFromState(state, referenceMonth)
  if (sorted.length === 0) return [referenceMonth]

  const start = sorted[0]
  const end = sorted[sorted.length - 1]
  const result = []
  let cur = start
  while (compareYearMonth(cur, end) <= 0) {
    result.push(cur)
    cur = shiftYearMonth(cur, 1)
  }
  return result
}

export function buildMultiMonthChartData(state, referenceMonth = currentYearMonth()) {
  return buildChartMonths(state, referenceMonth).map((yearMonth) => {
    const report = buildMonthlyReport(state, yearMonth, referenceMonth)
    return {
      yearMonth,
      monthLabel: yearMonth.slice(5) + '/' + yearMonth.slice(2, 4),
      gelir: report.totalIncome,
      kartMin: report.totalCardMinPayment,
      krediTaksit: report.totalLoanInstallment,
      digerOdeme: report.totalOtherPayment,
      toplamGider: report.totalExpenses,
      bakiye: report.balance,
    }
  })
}

export function findFirstSurplusMonth(state, referenceMonth = currentYearMonth()) {
  const months = buildChartMonths(state, referenceMonth)
  for (const yearMonth of months) {
    if (compareYearMonth(yearMonth, referenceMonth) < 0) continue
    const report = buildMonthlyReport(state, yearMonth, referenceMonth)
    if (report.totalIncome > report.totalExpenses) {
      return { yearMonth, report }
    }
  }
  return null
}
