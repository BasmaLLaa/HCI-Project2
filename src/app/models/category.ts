export type CategoryType = 'expense' | 'income';

export interface Category {
  id: number;
  name: string;
  color: string;
  type: CategoryType;
  icon?: string;
}
