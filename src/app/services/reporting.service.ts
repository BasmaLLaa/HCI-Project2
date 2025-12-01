import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';

import { Budget } from '../models/budget';
import { SpendByCategory, PeriodSummary } from '../models/report';
import { Transaction } from '../models/transaction';
import { Category } from '../models/category';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  constructor(
    private budgetService: BudgetService,
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  getBudgetTotals(): Observable<{ totalLimit: number; totalSpent: number }> {
    return this.budgetService.getBudgets().pipe(
      map((budgets: Budget[]) => {
        const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
        const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
        return { totalLimit, totalSpent };
      })
    );
  }

  getCashflow(): Observable<{ income: number; expenses: number; balance: number }> {
    return this.transactionService.getTransactions().pipe(
      map((transactions: Transaction[]) => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, balance: income - expenses };
      })
    );
  }

  getSpendByCategory(): Observable<SpendByCategory[]> {
    return combineLatest([this.transactionService.getTransactions(), this.categoryService.categories$]).pipe(
      map(([transactions, categories]: [Transaction[], Category[]]) => {
        const totals = categories.map(category => {
          const total = transactions
            .filter(tx => tx.categoryId === category.id && tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);
          const overallExpenses = transactions
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);
          const percent = overallExpenses ? Math.round((total / overallExpenses) * 100) : 0;
          return { categoryId: category.id, category: category.name, total, percent };
        });
        return totals.filter(t => t.total > 0);
      })
    );
  }

  getMonthlySummaries(): Observable<PeriodSummary[]> {
    return this.transactionService.getTransactions().pipe(
      map((transactions: Transaction[]) => {
        const grouped: Record<
          string,
          PeriodSummary & {
            timestamp: number;
          }
        > = {};

        transactions.forEach(tx => {
          const date = new Date(tx.date);
          const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          grouped[key] ??= {
            label: key,
            income: 0,
            expenses: 0,
            balance: 0,
            timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime()
          };
          if (tx.type === 'income') {
            grouped[key].income += tx.amount;
          } else {
            grouped[key].expenses += tx.amount;
          }
        });

        return Object.values(grouped)
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(item => ({
            label: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            income: item.income,
            expenses: item.expenses,
            balance: item.income - item.expenses
          }));
      })
    );
  }
}
