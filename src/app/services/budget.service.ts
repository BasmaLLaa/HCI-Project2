import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, tap } from 'rxjs';

import { Budget } from '../models/budget';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly baseUrl = 'api/budgets';
  private transactionService = inject(TransactionService);
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);

  readonly budgets$ = combineLatest([this.budgetsSubject.asObservable(), this.transactionService.getTransactions()]).pipe(
    map(([budgets, transactions]) =>
      budgets.map((budget) => ({
        ...budget,
        spent: transactions
          .filter((tx) => tx.budgetId === budget.id && tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0)
      }))
    )
  );

  constructor(private http: HttpClient) {
    this.refresh();
  }

  getBudgets(): Observable<Budget[]> {
    return this.budgets$;
  }

  createBudget(budget: Omit<Budget, 'id' | 'spent'> & Partial<Pick<Budget, 'spent'>>): Observable<Budget> {
    const payload: Omit<Budget, 'id'> = {
      spent: budget.spent ?? 0,
      ...budget
    };

    return this.http.post<Budget>(this.baseUrl, payload).pipe(
      tap((created) => {
        // Push the newly created budget immediately so lists update without waiting on a separate fetch
        const current = this.budgetsSubject.value;
        this.budgetsSubject.next([...current, created]);
      })
    );
  }

  updateBudget(budget: Budget): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl}/${budget.id}`, budget).pipe(tap(() => this.refresh()));
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(tap(() => this.refresh()));
  }

  refresh(): void {
    this.http.get<Budget[]>(this.baseUrl).subscribe(budgets => this.budgetsSubject.next(budgets));
  }
}
