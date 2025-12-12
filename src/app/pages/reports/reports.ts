import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

import { Goal } from '../../models/goal';
import { PeriodSummary } from '../../models/report';
import { Transaction } from '../../models/transaction';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { GoalService } from '../../services/goal.service';
import { ReportingService } from '../../services/reporting.service';
import { TransactionService } from '../../services/transaction.service';

type PeriodKey = '1m' | '3m' | '6m' | 'ytd' | 'custom';

interface PeriodSelection {
  key: PeriodKey;
  start?: string;
  end?: string;
}

interface IncomeVsExpensesView {
  label: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  months: Array<{ label: string; income: number; expenses: number; net: number; ts: number }>;
  maxValue: number;
}

interface BudgetVarianceView {
  id: number;
  name: string;
  limit: number;
  actual: number;
  variance: number;
  percentUsed: number;
  categories: string[];
}

interface SavingsView {
  goal: Goal;
  goals: Goal[];
  progress: number;
  projectedDate: Date | null;
  averageSurplus: number;
  remaining: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, FormsModule, NgClass, NgIf],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent implements OnInit {
  private readonly reportingService = inject(ReportingService);
  private readonly transactionService = inject(TransactionService);
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly goalService = inject(GoalService);

  readonly periodOptions: Array<{ key: PeriodKey; label: string }> = [
    { key: '1m', label: 'Last month' },
    { key: '3m', label: 'Last 3 months' },
    { key: '6m', label: 'Last 6 months' },
    { key: 'ytd', label: 'Year to date' },
    { key: 'custom', label: 'Custom range' }
  ];

  selectedPeriod: PeriodKey = '3m';
  customStartDate = this.isoDate(this.monthsAgo(2, true));
  customEndDate = this.isoDate(new Date());
  savingGoalBusy = false;
  goalForm = { target: 0, current: 0 };

  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  private selectedGoalId$ = new BehaviorSubject<number | null>(null);
  private periodSelection$ = new BehaviorSubject<PeriodSelection>({ key: this.selectedPeriod });

  private readonly range$ = this.periodSelection$.pipe(map(selection => this.resolveRange(selection)));

  private readonly filteredTransactions$ = combineLatest([this.transactionService.getTransactions(), this.range$]).pipe(
    map(([transactions, range]) =>
      transactions.filter(tx => {
        const date = new Date(tx.date);
        return date >= range.start && date <= range.end;
      })
    )
  );

  // Income vs Expenses view driven by the resolved date range; regenerates buckets, labels, and totals on every change.
  readonly incomeVsExpenses$ = combineLatest([this.transactionService.getTransactions(), this.range$]).pipe(
    map(([transactions, range]) => this.buildIncomeVsExpenses(range, transactions))
  );

  readonly budgetVariance$ = combineLatest([this.budgetService.getBudgets(), this.filteredTransactions$, this.categoryService.categories$]).pipe(
    map(([budgets, transactions, categories]) =>
      budgets.map(budget => {
        const categoryIds = budget.categoryIds ?? [];
        const relevantTransactions = transactions.filter(
          tx =>
            tx.type === 'expense' &&
            (
              // Prefer explicit budget match when a transaction is assigned to a budget
              (tx.budgetId != null && tx.budgetId === budget.id) ||
              // Fall back to category matching only for unassigned transactions
              (tx.budgetId == null && (categoryIds.length === 0 || categoryIds.includes(tx.categoryId)))
            )
        );
        const actual = relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const variance = budget.limit - actual;
        const percentUsed = budget.limit > 0 ? Math.min(200, Math.round((actual / budget.limit) * 100)) : 0;
        const categoryNames = categories
          .filter(cat => categoryIds.includes(cat.id))
          .map(cat => cat.name);

        return {
          id: budget.id,
          name: budget.name,
          limit: budget.limit,
          actual,
          variance,
          percentUsed,
          categories: categoryNames
        } as BudgetVarianceView;
      })
    )
  );

  private readonly monthlyByRange$ = combineLatest([this.filteredTransactions$, this.range$]).pipe(
    map(([txs, { start, end }]) =>
      this.computeMonthlyBuckets(txs, start, end).map(item => ({
        label: item.label,
        income: item.income,
        expenses: item.expenses,
        balance: item.net
      }))
    )
  );

  readonly savings$ = combineLatest([this.goalsSubject.asObservable(), this.monthlyByRange$, this.selectedGoalId$]).pipe(
    map(([goals, monthly, selectedId]) => {
      if (!goals.length) {
        return null;
      }

      const goal = goals.find(g => g.id === selectedId) ?? goals[0];
      if (goal && this.selectedGoalId$.value !== goal.id) {
        this.selectedGoalId$.next(goal.id);
      }

      this.goalForm.target = goal.targetAmount;
      this.goalForm.current = goal.currentAmount;

      const averageSurplus =
        monthly.length > 0 ? monthly.reduce((sum, item) => sum + item.balance, 0) / monthly.length : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const monthsToGoal = averageSurplus > 0 ? Math.ceil(remaining / averageSurplus) : null;
      const projectedDate = monthsToGoal ? this.addMonths(new Date(), monthsToGoal) : null;

      return {
        goal,
        goals,
        progress: this.progressPercent(goal.currentAmount, goal.targetAmount),
        projectedDate,
        averageSurplus,
        remaining
      } as SavingsView;
    })
  );

  ngOnInit(): void {
    this.refreshGoals();
  }

  onPeriodChange(key: PeriodKey | string): void {
    const normalized = this.normalizePeriodKey(key);
    this.selectedPeriod = normalized;
    if (normalized !== 'custom') {
      this.periodSelection$.next({ key: normalized });
    } else {
      this.applyCustomRange();
    }
  }

  applyCustomRange(): void {
    this.periodSelection$.next({ key: 'custom', start: this.customStartDate, end: this.customEndDate });
  }

  onGoalChange(goalId: number | string | null): void {
    const parsed = Number(goalId);
    if (Number.isFinite(parsed)) {
      this.selectedGoalId$.next(parsed);
    }
  }

  barHeight(value: number, max: number): number {
    if (!max || max <= 0) {
      return 0;
    }
    return Math.round((value / max) * 100);
  }

  progressGradient(percent: number): string {
    return `conic-gradient(from 270deg, var(--accent) ${percent}%, rgba(255,255,255,0.08) ${percent}% 100%)`;
  }

  // Build Income vs Expenses view for the resolved period.
  // Steps:
  // 1) Use the resolved start/end dates and label for the period.
  // 2) Pre-seed one bucket per month in the period so the chart always shows the exact count (1, 3, 6, YTD, or custom span).
  // 3) Add income/expense totals into their matching month bucket.
  // 4) Compute per-month net, overall totals, and a max value for chart scaling.
  private buildIncomeVsExpenses(
    range: { start: Date; end: Date; label: string; monthCount: number },
    transactions: Transaction[]
  ): IncomeVsExpensesView {
    const { start, end, label, monthCount } = range;
    const buckets = this.createMonthBuckets(start, monthCount);

    const bucketMap = new Map<string, { income: number; expenses: number; ts: number; label: string }>();
    buckets.forEach(bucket => bucketMap.set(this.bucketKey(bucket.ts), { ...bucket }));

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate < start || txDate > end) {
        return;
      }
      const key = this.bucketKey(txDate.getTime());
      const bucket = bucketMap.get(key);
      if (!bucket) {
        return;
      }
      if (tx.type === 'income') {
        bucket.income += tx.amount;
      } else {
        bucket.expenses += tx.amount;
      }
    });

    const months = Array.from(bucketMap.values())
      .map(b => ({ ...b, net: b.income - b.expenses }))
      .sort((a, b) => a.ts - b.ts);

    const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);
    const maxValue = Math.max(...months.map(m => Math.max(m.income, m.expenses)), totalIncome, totalExpenses, 1);

    return {
      label,
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      months,
      maxValue
    };
  }

  // Create one bucket per month starting at "startMonth" for "count" months.
  // This guarantees the chart shows exactly the number of months implied by the selected period.
  private createMonthBuckets(
    startMonth: Date,
    count: number
  ): Array<{ income: number; expenses: number; ts: number; label: string }> {
    const buckets: Array<{ income: number; expenses: number; ts: number; label: string }> = [];
    const cursor = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);

    for (let i = 0; i < count; i += 1) {
      const ts = cursor.getTime();
      buckets.push({
        income: 0,
        expenses: 0,
        ts,
        label: new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets;
  }

  updateSavingsGoal(goal: Goal | null | undefined): void {
    if (!goal) {
      return;
    }

    const payload: Goal = {
      ...goal,
      targetAmount: Number(this.goalForm.target) || 0,
      currentAmount: Number(this.goalForm.current) || 0
    };

    this.savingGoalBusy = true;
    this.goalService.updateGoal(payload).subscribe({
      next: () => this.refreshGoals(),
      complete: () => (this.savingGoalBusy = false)
    });
  }

  formatCategories(names: string[]): string {
    if (!names.length) {
      return 'All spending';
    }
    return names.join(', ');
  }

  trackById<T extends { id: number }>(_: number, item: T): number {
    return item.id;
  }

  private refreshGoals(): void {
    this.goalService.getGoals().subscribe(goals => {
      this.goalsSubject.next(goals);
      if (!this.selectedGoalId$.value && goals.length) {
        this.selectedGoalId$.next(goals[0].id);
      }
    });
  }

  private resolveRange(selection: PeriodSelection): { start: Date; end: Date; label: string; monthCount: number } {
    const now = new Date();

    // Helper to build a "last N months" range excluding the current partial month.
    const lastNMonths = (n: number) => {
      const endMonth = new Date(now.getFullYear(), now.getMonth(), 1); // start of current month
      endMonth.setMonth(endMonth.getMonth()); // current month start
      endMonth.setDate(0); // move to last day of previous month
      const end = this.atEndOfDay(endMonth);
      const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - (n - 1), 1);
      const start = this.atStartOfDay(startMonth);
      return { start, end, monthCount: n };
    };

    let start = this.atStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    let end = this.atEndOfDay(now);
    let label = 'This month';
    let monthCount = 1;

    if (selection.key === 'custom' && selection.start && selection.end) {
      const parsedStart = new Date(selection.start);
      const parsedEnd = new Date(selection.end);
      start = this.atStartOfDay(parsedStart);
      end = this.atEndOfDay(parsedEnd);
      monthCount = this.monthDiffInclusive(start, end);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (selection.key === '1m') {
      const range = lastNMonths(1);
      start = range.start;
      end = range.end;
      monthCount = range.monthCount;
      label = 'Last month';
    } else if (selection.key === '3m') {
      const range = lastNMonths(3);
      start = range.start;
      end = range.end;
      monthCount = range.monthCount;
      label = 'Last 3 months';
    } else if (selection.key === '6m') {
      const range = lastNMonths(6);
      start = range.start;
      end = range.end;
      monthCount = range.monthCount;
      label = 'Last 6 months';
    } else if (selection.key === 'ytd') {
      start = this.atStartOfDay(new Date(now.getFullYear(), 0, 1));
      end = this.atEndOfDay(now);
      monthCount = this.monthDiffInclusive(start, end);
      label = 'Year to date';
    }

    if (start > end) {
      [start, end] = [end, start];
    }
    if (Number.isNaN(start.getTime())) {
      start = this.atStartOfDay(now);
    }

    return { start, end, label, monthCount };
  }

  private bucketKey(timestamp: number): string {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private monthDiffInclusive(start: Date, end: Date): number {
    const startMonth = start.getFullYear() * 12 + start.getMonth();
    const endMonth = end.getFullYear() * 12 + end.getMonth();
    return Math.max(1, endMonth - startMonth + 1);
  }

  private monthsAgo(count: number, startOfMonth = false): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - count);
    if (startOfMonth) {
      date.setDate(1);
    }
    return date;
  }

  private isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private atStartOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private atEndOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private progressPercent(current: number, target: number): number {
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((current / target) * 100));
  }

  private normalizePeriodKey(value: string | PeriodKey): PeriodKey {
    const allowed: PeriodKey[] = ['1m', '3m', '6m', 'ytd', 'custom'];
    return allowed.includes(value as PeriodKey) ? (value as PeriodKey) : '3m';
  }

  private computeMonthlyBuckets(
    transactions: Transaction[],
    start: Date,
    end: Date
  ): Array<{ label: string; income: number; expenses: number; net: number; ts: number }> {
    const buckets: Record<string, { income: number; expenses: number; ts: number; label: string }> = {};

    // Pre-fill months in range with zeros so the chart always shows each month in the selected period.
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1).getTime();
    while (cursor.getTime() <= endMonth) {
      const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}`;
      buckets[key] = {
        income: 0,
        expenses: 0,
        ts: cursor.getTime(),
        label: new Date(cursor.getTime()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      if (date < start || date > end) {
        return;
      }
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!buckets[key]) {
        return;
      }
      if (tx.type === 'income') {
        buckets[key].income += tx.amount;
      } else {
        buckets[key].expenses += tx.amount;
      }
    });

    return Object.values(buckets)
      .map(item => ({ ...item, net: item.income - item.expenses }))
      .sort((a, b) => a.ts - b.ts);
  }

  private addMonths(date: Date, months: number): Date {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
  }
}
