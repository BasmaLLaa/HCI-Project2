import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Budget } from '../models/budget';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly baseUrl = 'api/budgets';
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  readonly budgets$ = this.budgetsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refresh();
  }

  getBudgets(): Observable<Budget[]> {
    return this.budgets$;
  }

  createBudget(budget: Omit<Budget, 'id' | 'spent'> & Partial<Pick<Budget, 'spent'>>): Observable<Budget> {
    const payload: Budget = {
      spent: budget.spent ?? 0,
      ...budget,
      id: 0
    };

    return this.http.post<Budget>(this.baseUrl, payload).pipe(tap(() => this.refresh()));
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
