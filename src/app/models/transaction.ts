export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  categoryId: number;
  budgetId?: number;
  type: TransactionType;
  paymentMethod?: string;
  recurring?: boolean;
}
