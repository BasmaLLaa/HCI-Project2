import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Transaction } from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly baseUrl = 'api/transactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.baseUrl);
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    // let backend generate id to avoid overwriting previous entries
    return this.http.post<Transaction>(this.baseUrl, { ...transaction });
  }

  updateTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/${transaction.id}`, transaction);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
