import { compareYearMonth, currentYearMonth, monthDiff, shiftYearMonth } from './format'

/** Kredi başlangıcından itibaren toplam taksit sayısı (girişteki kalan vade) */
export function getLoanPaymentCount(loan) {
  return Math.max(0, Number(loan.remainingTerms) || 0)
}

export function computeLoanEndMonth(startMonth, paymentCount) {
  if (!startMonth || paymentCount <= 0) return startMonth
  return shiftYearMonth(startMonth, paymentCount - 1)
}

export function getLoanStartMonth(loan) {
  if (loan.startMonth) return loan.startMonth
  if (loan.endMonth) {
    const count = getLoanPaymentCount(loan)
    if (count > 0) return shiftYearMonth(loan.endMonth, -(count - 1))
  }
  return currentYearMonth()
}

export function getLoanEndMonth(loan) {
  if (loan.endMonth) return loan.endMonth
  const start = getLoanStartMonth(loan)
  const count = getLoanPaymentCount(loan)
  return computeLoanEndMonth(start, count)
}

/** Seçili aydan kredi bitişine kadar kalan taksit sayısı (dahil) */
export function getPaymentsRemaining(loan, viewMonth) {
  const start = getLoanStartMonth(loan)
  const end = getLoanEndMonth(loan)
  const count = getLoanPaymentCount(loan)
  if (count <= 0) return 0
  if (compareYearMonth(viewMonth, end) > 0) return 0
  if (compareYearMonth(viewMonth, start) < 0) {
    return monthDiff(start, end) + 1
  }
  return monthDiff(viewMonth, end) + 1
}

export function isLoanActiveInMonth(loan, viewMonth) {
  const count = getLoanPaymentCount(loan)
  if (count <= 0) return false
  const start = getLoanStartMonth(loan)
  const end = getLoanEndMonth(loan)
  return compareYearMonth(viewMonth, start) >= 0 && compareYearMonth(viewMonth, end) <= 0
}

export function isLoanClosed(loan, viewMonth) {
  return getPaymentsRemaining(loan, viewMonth) === 0
}

/** Seçili ayda manuel veya otomatik taksit tutarı */
export function getLoanInstallmentForMonth(loan, yearMonth) {
  const manual = (loan.futureInstallments || []).find((r) => r.month === yearMonth)
  if (manual) return Number(manual.amount) || 0
  if (isLoanActiveInMonth(loan, yearMonth)) return Number(loan.monthlyPayment) || 0
  return 0
}

/** Cari aydan sonraki aylar tahmini; ödeme durumu taşınmaz */
export function isLoanMonthProjected(viewMonth, cariAy = currentYearMonth()) {
  return compareYearMonth(viewMonth, cariAy) > 0
}

export function isLoanInstallmentPaid(loan, yearMonth, cariAy = currentYearMonth()) {
  if (isLoanMonthProjected(yearMonth, cariAy)) return false
  const manual = (loan.futureInstallments || []).find((r) => r.month === yearMonth)
  if (manual) return Boolean(manual.paid)
  return yearMonth === cariAy && Boolean(loan.installmentPaid)
}

export function loanHasInstallmentInMonth(loan, yearMonth) {
  return getLoanInstallmentForMonth(loan, yearMonth) > 0
}

/** Seçili ayın tek taksit tutarı */
export function loanMonthlyDue(loan, viewMonth, cariAy = currentYearMonth()) {
  const amount = getLoanInstallmentForMonth(loan, viewMonth)
  if (amount <= 0) return 0
  if (isLoanInstallmentPaid(loan, viewMonth, cariAy)) return 0
  return amount
}

/** Seçili aydan itibaren kalan tüm taksitlerin toplamı */
export function loanForwardTotal(loan, viewMonth, cariAy = currentYearMonth()) {
  let count = getPaymentsRemaining(loan, viewMonth)
  if (count <= 0) return 0
  if (viewMonth === cariAy && loan.installmentPaid) {
    count = Math.max(0, count - 1)
  }
  return count * (Number(loan.monthlyPayment) || 0)
}

export function buildLoanPayload(form, fallbackStartMonth) {
  const totalTerms = Math.max(1, Number(form.totalTerms) || 1)
  const paymentCount = Math.min(totalTerms, Math.max(0, Number(form.remainingTerms) || 0))
  const startMonth = form.startMonth || fallbackStartMonth
  const endMonth = paymentCount > 0 ? computeLoanEndMonth(startMonth, paymentCount) : startMonth
  return {
    ...form,
    totalTerms,
    remainingTerms: paymentCount,
    startMonth,
    endMonth,
  }
}
