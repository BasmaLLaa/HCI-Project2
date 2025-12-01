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

    const budgets: Budget[] = [
      { id: 1, name: 'Monthly Essentials', limit: 2500, spent: 1325, period: 'Monthly', categoryIds: [1, 2, 3], resetDay: 1 },
      { id: 2, name: 'Fun & Leisure', limit: 600, spent: 180, period: 'Monthly', categoryIds: [4], resetDay: 1 },
      { id: 3, name: 'Investing', limit: 800, spent: 200, period: 'Monthly', categoryIds: [6], resetDay: 15 }
    ];

    const transactions: Transaction[] = [
      { id: 1, description: 'Apartment rent', amount: 900, date: '2025-11-01', categoryId: 1, budgetId: 1, type: 'expense', paymentMethod: 'card' },
      { id: 2, description: 'Groceries', amount: 120, date: '2025-11-04', categoryId: 2, budgetId: 1, type: 'expense', paymentMethod: 'card' },
      { id: 3, description: 'Metro pass', amount: 60, date: '2025-11-05', categoryId: 3, budgetId: 1, type: 'expense', paymentMethod: 'card' },
      { id: 4, description: 'Movie night', amount: 55, date: '2025-11-06', categoryId: 4, budgetId: 2, type: 'expense', paymentMethod: 'card' },
      { id: 5, description: 'November salary', amount: 3600, date: '2025-11-01', categoryId: 5, type: 'income', paymentMethod: 'bank' },
      { id: 6, description: 'ETF contribution', amount: 200, date: '2025-11-07', categoryId: 6, budgetId: 3, type: 'expense', recurring: true },
      { id: 7, description: 'Dinner out', amount: 75, date: '2025-11-08', categoryId: 2, budgetId: 2, type: 'expense' }
    ];

    const profiles: ProfileSettings[] = [
      {
        id: 1,
        name: 'Amina Farouk',
        email: 'amina@example.com',
        currency: 'USD',
        savingsGoal: 5000,
        monthlyTarget: 1200,
        notifications: true
      }
    ];

    const goals: Goal[] = [
      { id: 1, title: 'Emergency fund', targetAmount: 5000, currentAmount: 2400, dueDate: '2026-03-01', categoryId: 6, note: '6 months of expenses' },
      { id: 2, title: 'Trip to Aswan', targetAmount: 1200, currentAmount: 450, dueDate: '2026-01-15', categoryId: 4 },
      { id: 3, title: 'Credit card payoff', targetAmount: 900, currentAmount: 300, dueDate: '2025-12-20', categoryId: 1 }
    ];

    const users: User[] = [
      { id: 1, name: 'Amina Farouk', email: 'amina@example.com', password: 'password123' }
    ];

    return { categories, budgets, transactions, profiles, goals, users };
  }

  genId<T extends { id: number }>(collection: T[]): number {
    return collection.length ? Math.max(...collection.map(item => item.id)) + 1 : 1;
  }
}
