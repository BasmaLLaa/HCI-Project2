import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Goal } from '../models/goal';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private readonly baseUrl = 'api/goals';
  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  readonly goals$ = this.goalsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refresh();
  }

  getGoals(): Observable<Goal[]> {
    return this.goals$;
  }

  createGoal(goal: Omit<Goal, 'id'>): Observable<Goal> {
    return this.http.post<Goal>(this.baseUrl, { ...goal }).pipe(
      tap((created) => {
        // Immediately expose the new goal so dashboards update without a manual refresh
        this.goalsSubject.next([...this.goalsSubject.value, created]);
      })
    );
  }

  updateGoal(goal: Goal): Observable<Goal> {
    return this.http.put<Goal>(`${this.baseUrl}/${goal.id}`, goal).pipe(
      tap((updated) => {
        // Use server response when present; otherwise fall back to the payload we sent
        const merged = updated ? { ...goal, ...updated } : goal;
        const next = this.goalsSubject.value.map((g) => (g.id === merged.id ? merged : g));
        this.goalsSubject.next(next);
      })
    );
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.goalsSubject.next(this.goalsSubject.value.filter((g) => g.id !== id)))
    );
  }

  refresh(): void {
    this.http.get<Goal[]>(this.baseUrl).subscribe((goals) => this.goalsSubject.next(goals));
  }
}
