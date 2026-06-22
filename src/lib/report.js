import {
  compareYearMonth,
  currentYearMonth,
  formatMoney,
  formatMonthShort,
  shiftYearMonth,
  yearMonthFromDate,
} from './format'
import {
  getLoanEndMonth,
  getLoanStartMonth,
  getLoanInstallmentForMonth,
  getPaymentsRemaining,
  isLoanClosed,
  isLoanInstallmentPaid,
  loanForwardTotal,
  loanHasInstallmentInMonth,
  loanMonthlyDue,
} from './loanUtils'
import { isNegativeBalancePayment } from './paymentCategories'
import {
  buildCreditCardsForMonth,
  buildOtherPaymentsForMonth,
  buildProjectedState,
  isProjectedCard,
  isProjectedPayment,
} from './projection'

export {
  buildCreditCardsForMonth,
  buildOtherPaymentsForMonth,
  buildProjectedState,
  isProjectedCard,
  isProjectedPayment,
}

function creditCardDueAmount(card) {
  if (card.fullyPaid || card.minPaid) return 0
  return Number(card.minPayment) || 0
}

function creditCardPaidAmount(card) {
  if (card.fullyPaid || card.minPaid) return Number(card.minPayment) || 0
  return 0
}

function otherDueAmount(payment) {
  if (payment.paid) return 0
  return Number(payment.amount) || 0
}

function otherPaidAmount(payment) {
  if (payment.paid) return Number(payment.amount) || 0
  return 0
}

function paidLabel(card) {
  if (card.fullyPaid) return 'Tamamı ödendi'
  if (card.minPaid) return 'Asgari ödendi'
  return null
}

export function buildHomeReport(state, yearMonth, cariAy = currentYearMonth()) {
  const projection = buildProjectedState(state, yearMonth, cariAy)
  const report = buildMonthlyReport(projection.state, yearMonth, cariAy)
  return {
    ...report,
    isProjected: projection.isProjected,
    projectedParts: projection.projectedParts,
    projectedFrom: projection.isProjected ? cariAy : null,
  }
}

/** referenceMonth = cari ay (ödeme durumu yalnızca cari ay için geçerlidir) */
export function buildMonthlyReport(state, yearMonth, referenceMonth = currentYearMonth()) {
  const creditCardItems = state.creditCards
    .filter((c) => c.dueMonth === yearMonth)
    .map((c) => {
      const amount = Number(c.minPayment) || 0
      const dueAmount = creditCardDueAmount(c)
      const paidAmount = creditCardPaidAmount(c)
      const paid = Boolean(c.fullyPaid || c.minPaid)
      return {
        id: c.id,
        category: 'Kredi Kartı',
        label: c.bankName,
        amount,
        dueAmount,
        paidAmount,
        paid,
        paidLabel: paidLabel(c),
        detail: `Toplam borç: ${formatMoney(c.totalDebt)}`,
        sortKey: 1,
      }
    })

  const activeLoans = state.loans.filter((l) => !isLoanClosed(l, yearMonth))

  const loanItems = activeLoans
    .filter((l) => loanHasInstallmentInMonth(l, yearMonth))
    .map((l) => {
      const paymentsLeft = getPaymentsRemaining(l, yearMonth)
      const amount = getLoanInstallmentForMonth(l, yearMonth)
      const dueAmount = loanMonthlyDue(l, yearMonth, referenceMonth)
      const forwardTotal = loanForwardTotal(l, yearMonth, referenceMonth)
      const paid = isLoanInstallmentPaid(l, yearMonth, referenceMonth)
      const paidAmount = paid ? amount : 0
      return {
        id: l.id,
        category: 'Banka Kredisi',
        label: l.bankName,
        amount,
        monthlyAmount: amount,
        dueAmount,
        paidAmount,
        forwardTotal,
        paid,
        paidLabel: paid ? 'Taksit ödendi' : null,
        detail: `Başlangıç: ${formatMonthShort(getLoanStartMonth(l))} · Bitiş: ${formatMonthShort(getLoanEndMonth(l))} · Kalan: ${paymentsLeft} ay · İleri toplam: ${formatMoney(forwardTotal)}`,
        sortKey: 2,
      }
    })

  const otherItems = state.otherPayments
    .filter((p) => yearMonthFromDate(p.dueDate) === yearMonth)
    .map((p) => {
      const amount = Number(p.amount) || 0
      const paid = Boolean(p.paid)
      const isNegativeBalance = Boolean(p.isNegativeBalance) || isNegativeBalancePayment(p)
      return {
        id: p.id,
        category: p.type,
        label: p.name || p.type,
        amount,
        dueAmount: otherDueAmount(p),
        paidAmount: otherPaidAmount(p),
        paid,
        isNegativeBalance,
        paidLabel: paid ? 'Ödendi' : null,
        detail: p.dueDate,
        sortKey: isNegativeBalance ? 4 : 3,
      }
    })

  const regularOtherItems = otherItems.filter((i) => !i.isNegativeBalance)
  const negativeBalanceItems = otherItems.filter((i) => i.isNegativeBalance)

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

  const totalCardMinGross = creditCardItems.reduce((s, i) => s + i.amount, 0)
  const totalCardMinPaid = creditCardItems.reduce((s, i) => s + i.paidAmount, 0)
  const totalCardMinPayment = creditCardItems.reduce((s, i) => s + i.dueAmount, 0)

  const totalCardPayoff = state.creditCards.reduce(
    (s, c) => s + (c.fullyPaid ? 0 : Number(c.totalDebt) || 0),
    0
  )

  const totalLoanGross = loanItems.reduce((s, i) => s + i.amount, 0)
  const totalLoanPaid = loanItems.reduce((s, i) => s + i.paidAmount, 0)
  const totalLoanInstallment = loanItems.reduce((s, i) => s + i.dueAmount, 0)
  const totalLoanForward = activeLoans.reduce(
    (s, l) => s + loanForwardTotal(l, yearMonth, referenceMonth),
    0
  )
  const totalLoanPayoff = activeLoans.reduce((s, l) => s + (Number(l.payoffAmount) || 0), 0)

  const totalOtherGross = regularOtherItems.reduce((s, i) => s + i.amount, 0)
  const totalOtherPaid = regularOtherItems.reduce((s, i) => s + i.paidAmount, 0)
  const totalOtherPayment = regularOtherItems.reduce((s, i) => s + i.dueAmount, 0)

  const totalNegativeBalanceGross = negativeBalanceItems.reduce((s, i) => s + i.amount, 0)
  const totalNegativeBalancePaid = negativeBalanceItems.reduce((s, i) => s + i.paidAmount, 0)
  const totalNegativeBalanceDue = negativeBalanceItems.reduce((s, i) => s + i.dueAmount, 0)

  // Toplam Min = kart min + kredi taksit + diğer ödemeler (negatif bakiye hariç)
  const totalMinAmount = totalCardMinGross + totalLoanGross + totalOtherGross
  const totalPaidAmount =
    totalCardMinPaid + totalLoanPaid + totalOtherPaid + totalNegativeBalancePaid
  const remainingMinAmount = totalMinAmount - (totalCardMinPaid + totalLoanPaid + totalOtherPaid)
  const payableAmount = remainingMinAmount + totalNegativeBalanceDue
  const grandTotalAllDebt = totalCardPayoff + totalLoanPayoff + totalNegativeBalanceGross

  const totalExpenses = payableAmount
  const totalPaidExpenses = totalPaidAmount

  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0)
  /** Gelir − brüt giderler (kart min + kredi taksit + diğer ödemeler, negatif hariç) */
  const incomeBalance = totalIncome - totalMinAmount
  const balance = totalIncome - payableAmount

  return {
    yearMonth,
    expenses: allExpenses,
    incomes: incomeItems,
    totalCardMinGross,
    totalCardMinPaid,
    totalCardMinPayment,
    totalCardPayoff,
    totalLoanGross,
    totalLoanPaid,
    totalLoanInstallment,
    totalLoanForward,
    totalLoanPayoff,
    totalOtherGross,
    totalOtherPaid,
    totalOtherPayment,
    totalNegativeBalanceGross,
    totalNegativeBalancePaid,
    totalNegativeBalanceDue,
    totalMinAmount,
    totalPaidAmount,
    remainingMinAmount,
    payableAmount,
    remainingTotalDebt: grandTotalAllDebt,
    grandTotalAllDebt,
    totalExpenses,
    totalPaidExpenses,
    totalIncome,
    incomeBalance,
    balance,
    totalDebt: totalCardPayoff,
    grandTotalDebt: grandTotalAllDebt,
  }
}

function collectMonthsFromState(state, referenceMonth) {
  const months = new Set([referenceMonth, currentYearMonth()])

  state.creditCards.forEach((c) => c.dueMonth && months.add(c.dueMonth))
  state.incomes.forEach((i) => i.month && months.add(i.month))
  state.otherPayments.forEach((p) => {
    const ym = yearMonthFromDate(p.dueDate)
    if (ym) months.add(ym)
  })

  state.loans.forEach((l) => {
    const start = getLoanStartMonth(l)
    const end = getLoanEndMonth(l)
    let cur = start
    while (compareYearMonth(cur, end) <= 0) {
      months.add(cur)
      cur = shiftYearMonth(cur, 1)
    }
    ;(l.futureInstallments || []).forEach((row) => {
      if (row.month) months.add(row.month)
    })
  })

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

export function buildMultiMonthChartData(state, cariAy = currentYearMonth()) {
  return buildChartMonths(state, cariAy).map((yearMonth) => {
    const homeReport = buildHomeReport(state, yearMonth, cariAy)
    return {
      yearMonth,
      monthLabel: formatMonthShort(yearMonth),
      gelir: homeReport.totalIncome,
      giderler: homeReport.totalMinAmount,
      kartMin: homeReport.totalCardMinGross,
      krediTaksit: homeReport.totalLoanGross,
      digerOdeme: homeReport.totalOtherGross,
      toplamGider: homeReport.totalMinAmount,
      odenecek: homeReport.remainingMinAmount,
      bakiye: homeReport.incomeBalance,
      isProjected: homeReport.isProjected,
    }
  })
}

export function findFirstSurplusMonth(state, cariAy = currentYearMonth()) {
  const months = buildChartMonths(state, cariAy)
  for (const yearMonth of months) {
    if (compareYearMonth(yearMonth, cariAy) < 0) continue
    const report = buildHomeReport(state, yearMonth, cariAy)
    if (report.incomeBalance > 0) {
      return { yearMonth, report }
    }
  }
  return null
}
