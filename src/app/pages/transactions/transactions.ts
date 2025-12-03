import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';

import { Budget } from '../../models/budget';
import { Category } from '../../models/category';
import { Transaction, TransactionType } from '../../models/transaction';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { MATERIAL_IMPORTS } from '../../material';
import { StatusPillComponent } from '../../components/status-pill/status-pill';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    NgClass,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    TitleCasePipe,
    StatusPillComponent,
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss'
})
export class TransactionsComponent {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private budgetService = inject(BudgetService);

  transactions$: Observable<Transaction[]> = this.loadTransactions();
  readonly categories$ = this.categoryService.categories$;
  readonly budgets$: Observable<Budget[]> = this.budgetService.getBudgets();

  form = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
    amount: [50, [Validators.required, Validators.min(1)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    type: ['expense' as TransactionType, Validators.required],
    categoryId: [null as number | null, Validators.required],
    budgetId: [null as number | null],
    paymentMethod: ['card'],
    recurring: [false]
  });

  editingTransaction?: Transaction;
  submitting = false;

  private loadTransactions(): Observable<Transaction[]> {
    return this.transactionService.getTransactions().pipe(
      map((transactions) =>
        [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
    );
  }

  refresh(): void {
    this.transactions$ = this.loadTransactions();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { description, amount, date, type, categoryId, budgetId, paymentMethod, recurring } =
      this.form.getRawValue();
    if (!description || !amount || !date || !type || !categoryId) {
      return;
    }

    this.submitting = true;
    const payload: Omit<Transaction, 'id'> = {
      description,
      amount: Number(amount),
      date,
      type,
      categoryId,
      budgetId: budgetId ?? undefined,
      paymentMethod: paymentMethod ?? 'card',
      recurring: recurring ?? false
    };

    const request = this.editingTransaction
      ? this.transactionService.updateTransaction({ ...payload, id: this.editingTransaction.id })
      : this.transactionService.createTransaction(payload);

    request.subscribe({
      next: () => {
        this.resetForm();
        this.refresh();
      },
      complete: () => (this.submitting = false)
    });
  }

  edit(tx: Transaction): void {
    this.editingTransaction = tx;
    this.form.patchValue({
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      type: tx.type,
      categoryId: tx.categoryId,
      budgetId: tx.budgetId ?? null,
      paymentMethod: tx.paymentMethod,
      recurring: tx.recurring ?? false
    });
  }

  delete(tx: Transaction): void {
    this.submitting = true;
    this.transactionService.deleteTransaction(tx.id).subscribe({
      next: () => this.refresh(),
      complete: () => {
        this.submitting = false;
        if (this.editingTransaction?.id === tx.id) {
          this.resetForm();
        }
      }
    });
  }

  resetForm(): void {
    this.editingTransaction = undefined;
    this.submitting = false;
    this.form.reset({
      description: '',
      amount: 50,
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      categoryId: null,
      budgetId: null,
      paymentMethod: 'card',
      recurring: false
    });
  }

  categoryName(categories: Category[] | null, id: number): string {
    return categories?.find((c) => c.id === id)?.name ?? 'Other';
  }

  trackByTx(index: number, tx: Transaction): number {
    return tx.id;
  }
}
