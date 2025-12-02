import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Transaction } from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly baseUrl = 'api/transactions';
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  readonly transactions$ = this.transactionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refresh();
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  createTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    // let backend generate id to avoid overwriting previous entries
    return this.http.post<Transaction>(this.baseUrl, { ...transaction }).pipe(tap(() => this.refresh()));
  }

  updateTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/${transaction.id}`, transaction).pipe(tap(() => this.refresh()));
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(tap(() => this.refresh()));
  }

  refresh(): void {
    this.http.get<Transaction[]>(this.baseUrl).subscribe(txs => this.transactionsSubject.next(txs));
  }
}
