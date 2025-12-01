export interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
  categoryId?: number;
  note?: string;
}
