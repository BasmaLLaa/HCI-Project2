import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, PercentPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';

import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { ReportingService } from '../../services/reporting.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction';
import { Category } from '../../models/category';
import { GoalService } from '../../services/goal.service';
import { Goal } from '../../models/goal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, PercentPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private budgetService = inject(BudgetService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private reportingService = inject(ReportingService);
  private goalService = inject(GoalService);

  readonly budgets$ = this.budgetService.getBudgets();
  readonly transactions$ = this.transactionService.getTransactions();
  readonly categories$ = this.categoryService.categories$;
  readonly goals$ = this.goalService.getGoals();

  readonly kpis$ = combineLatest([
    this.reportingService.getBudgetTotals(),
    this.reportingService.getCashflow(),
    this.budgets$
  ]).pipe(
    map(([budgetTotals, cashflow, budgets]) => ({
      budgetLimit: budgetTotals.totalLimit,
      budgetSpent: budgetTotals.totalSpent,
      utilization: budgetTotals.totalLimit
        ? Math.min(100, Math.round((budgetTotals.totalSpent / budgetTotals.totalLimit) * 100))
        : 0,
      activeBudgets: budgets.length,
      income: cashflow.income,
      expenses: cashflow.expenses,
      balance: cashflow.balance
    }))
  );

  readonly topCategories$ = this.reportingService.getSpendByCategory();
  readonly monthly$ = this.reportingService.getMonthlySummaries();

  readonly recentTransactions$ = this.transactions$.pipe(
    map((transactions: Transaction[]) =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
    )
  );

  readonly upcomingGoals$ = this.goals$.pipe(
    map((goals: Goal[]) =>
      [...goals]
        .sort((a, b) => {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return da - db;
        })
        .slice(0, 3)
    )
  );

  categoryName(categories: Category[], id: number): string {
    return categories.find((category) => category.id === id)?.name ?? 'Other';
  }

  goalProgress(goal: Goal): number {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }
}
