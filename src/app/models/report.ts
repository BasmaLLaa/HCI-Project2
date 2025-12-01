export interface SpendByCategory {
  categoryId: number;
  category: string;
  total: number;
  percent: number;
}

export interface PeriodSummary {
  label: string;
  income: number;
  expenses: number;
  balance: number;
}
