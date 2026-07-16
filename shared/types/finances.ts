export interface Money {
  amountInCents: number
  currency: string
  percentage?: number
}

export interface Balance {
  income: Money
  expenses: Money
  currentBalance: Money
  projectedBalance: Money
  currency: string
  essentialExpenses?: Money | null
  otherExpenses?: Money | null
  investments?: Money | null
}

export interface Currency {
  code: string
  label: string
  symbol: string
}
