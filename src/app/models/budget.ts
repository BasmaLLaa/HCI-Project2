export type BudgetPeriod = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface Budget {
  id: number;
  name: string;
  limit: number;
  spent: number;
  period: BudgetPeriod;
  categoryIds: number[];
  resetDay?: number;
}
