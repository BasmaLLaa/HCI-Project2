import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

import { Budget } from '../models/budget';
import { Category } from '../models/category';
import { ProfileSettings } from '../models/profile-settings';
import { Transaction } from '../models/transaction';
import { Goal } from '../models/goal';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const categories: Category[] = [
      { id: 1, name: 'Housing', color: '#7c3aed', type: 'expense', icon: 'home' },
      { id: 2, name: 'Food', color: '#22c55e', type: 'expense', icon: 'restaurant' },
      { id: 3, name: 'Transport', color: '#0ea5e9', type: 'expense', icon: 'directions_car' },
      { id: 4, name: 'Entertainment', color: '#f97316', type: 'expense', icon: 'celebration' },
      { id: 5, name: 'Salary', color: '#16a34a', type: 'income', icon: 'payments' },
      { id: 6, name: 'Investments', color: '#0f766e', type: 'income', icon: 'trending_up' }
    ];

    // Start with empty user data so real users add their own budgets, goals, and transactions.
    const budgets: Budget[] = [];
    const transactions: Transaction[] = [];
    const goals: Goal[] = [];
    const users: User[] = [];

    // Provide a blank profile scaffold so settings still load with default zero values.
    const profiles: ProfileSettings[] = [
      {
        id: 1,
        name: '',
        email: '',
        currency: 'USD',
        savingsGoal: 0,
        monthlyTarget: 0,
        notifications: false
      }
    ];

    return { categories, budgets, transactions, profiles, goals, users };
  }

  genId<T extends { id: number }>(collection: T[]): number {
    return collection.length ? Math.max(...collection.map(item => item.id)) + 1 : 1;
  }
}
