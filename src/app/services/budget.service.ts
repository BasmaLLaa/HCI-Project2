import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Budget } from '../models/budget';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly baseUrl = 'api/budgets';

  constructor(private http: HttpClient) {}

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.baseUrl);
  }

  createBudget(budget: Omit<Budget, 'id' | 'spent'> & Partial<Pick<Budget, 'spent'>>): Observable<Budget> {
    const payload: Budget = {
      spent: budget.spent ?? 0,
      ...budget,
      id: 0
    };

    return this.http.post<Budget>(this.baseUrl, payload);
  }

  updateBudget(budget: Budget): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl}/${budget.id}`, budget);
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
