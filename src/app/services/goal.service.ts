import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Goal } from '../models/goal';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private readonly baseUrl = 'api/goals';

  constructor(private http: HttpClient) {}

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.baseUrl);
  }

  createGoal(goal: Omit<Goal, 'id'>): Observable<Goal> {
    return this.http.post<Goal>(this.baseUrl, { ...goal, id: 0 });
  }

  updateGoal(goal: Goal): Observable<Goal> {
    return this.http.put<Goal>(`${this.baseUrl}/${goal.id}`, goal);
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
