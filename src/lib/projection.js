import { compareYearMonth, currentYearMonth, yearMonthFromDate } from './format'

export function isProjectedCard(card) {
  return Boolean(card?.isProjected) || String(card?.id || '').startsWith('proj-')
}

export function isProjectedPayment(payment) {
  return Boolean(payment?.isProjected) || String(payment?.id || '').startsWith('proj-')
}

export function isDismissedProjection(state, kind, targetMonth, sourceId) {
  return (state.dismissedProjections || []).some(
    (d) => d.kind === kind && d.targetMonth === targetMonth && d.sourceId === sourceId
  )
}

export function monthHasCardData(state, yearMonth) {
  return state.creditCards.some((c) => c.dueMonth === yearMonth && !isProjectedCard(c))
}

export function monthHasIncomeData(state, yearMonth) {
  return state.incomes.some((i) => i.month === yearMonth)
}

export function monthHasOtherData(state, yearMonth) {
  return state.otherPayments.some(
    (p) => yearMonthFromDate(p.dueDate) === yearMonth && !isProjectedPayment(p)
  )
}

export function buildProjectedCardsForMonth(state, targetMonth, anchorMonth = currentYearMonth()) {
  if (compareYearMonth(targetMonth, anchorMonth) <= 0) return []
  if (!state.creditCards.some((c) => c.dueMonth === anchorMonth)) return []

  const anchorCards = state.creditCards.filter((c) => c.dueMonth === anchorMonth)
  const realTargetCards = state.creditCards.filter(
    (c) => c.dueMonth === targetMonth && !isProjectedCard(c)
  )

  return anchorCards
    .filter((anchor) => {
      if (isDismissedProjection(state, 'card', targetMonth, anchor.id)) return false
      if (realTargetCards.some((r) => r.projectedFromCardId === anchor.id)) return false
      return true
    })
    .map((c) => ({
      ...c,
      id: `proj-${c.id}-${targetMonth}`,
      sourceCardId: c.id,
      dueMonth: targetMonth,
      minPaid: false,
      fullyPaid: false,
      isProjected: true,
    }))
}

export function buildProjectedPaymentsForMonth(state, targetMonth, anchorMonth = currentYearMonth()) {
  if (compareYearMonth(targetMonth, anchorMonth) <= 0) return []
  if (!state.otherPayments.some((p) => yearMonthFromDate(p.dueDate) === anchorMonth)) return []

  const anchorPayments = state.otherPayments.filter((p) => yearMonthFromDate(p.dueDate) === anchorMonth)
  const realTargetPayments = state.otherPayments.filter(
    (p) => yearMonthFromDate(p.dueDate) === targetMonth && !isProjectedPayment(p)
  )

  return anchorPayments
    .filter((anchor) => {
      if (isDismissedProjection(state, 'payment', targetMonth, anchor.id)) return false
      if (realTargetPayments.some((r) => r.projectedFromPaymentId === anchor.id)) return false
      return true
    })
    .map((p) => {
      const day = p.dueDate?.length >= 10 ? p.dueDate.slice(8, 10) : '01'
      return {
        ...p,
        id: `proj-${p.id}-${targetMonth}`,
        sourcePaymentId: p.id,
        dueDate: `${targetMonth}-${day}`,
        paid: false,
        isProjected: true,
      }
    })
}

export function buildProjectedState(state, targetMonth, anchorMonth = currentYearMonth()) {
  if (compareYearMonth(targetMonth, anchorMonth) <= 0) {
    return { state, isProjected: false, projectedParts: [] }
  }

  const projectedParts = []
  let next = { ...state }

  const projectedCards = buildProjectedCardsForMonth(state, targetMonth, anchorMonth)
  if (projectedCards.length > 0) {
    projectedParts.push('cards')
    next = { ...next, creditCards: [...next.creditCards, ...projectedCards] }
  }

  if (!monthHasIncomeData(state, targetMonth) && monthHasIncomeData(state, anchorMonth)) {
    projectedParts.push('income')
    const anchorIncomes = state.incomes.filter((i) => i.month === anchorMonth)
    next = {
      ...next,
      incomes: [
        ...next.incomes,
        ...anchorIncomes.map((i) => ({
          ...i,
          id: `proj-${i.id}-${targetMonth}`,
          month: targetMonth,
        })),
      ],
    }
  }

  const projectedPayments = buildProjectedPaymentsForMonth(state, targetMonth, anchorMonth)
  if (projectedPayments.length > 0) {
    projectedParts.push('other')
    next = { ...next, otherPayments: [...next.otherPayments, ...projectedPayments] }
  }

  return { state: next, isProjected: projectedParts.length > 0, projectedParts }
}

export function buildCreditCardsForMonth(state, yearMonth, cariAy = currentYearMonth()) {
  const realCards = state.creditCards.filter(
    (c) => c.dueMonth === yearMonth && !isProjectedCard(c)
  )
  const projectedCards = buildProjectedCardsForMonth(state, yearMonth, cariAy)
  return {
    cards: [...realCards, ...projectedCards],
    isProjected: projectedCards.length > 0,
    projectedFrom: projectedCards.length > 0 ? cariAy : null,
  }
}

export function buildOtherPaymentsForMonth(state, yearMonth, cariAy = currentYearMonth()) {
  const realPayments = state.otherPayments
    .filter((p) => yearMonthFromDate(p.dueDate) === yearMonth && !isProjectedPayment(p))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const projectedPayments = buildProjectedPaymentsForMonth(state, yearMonth, cariAy)
  const payments = [...realPayments, ...projectedPayments].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  )
  return {
    payments,
    isProjected: projectedPayments.length > 0,
    projectedFrom: projectedPayments.length > 0 ? cariAy : null,
  }
}
