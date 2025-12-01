import { AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Budget, BudgetPeriod } from '../../models/budget';
import { Category } from '../../models/category';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './budgets.html',
  styleUrl: './budgets.scss'
})
export class BudgetsComponent {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  budgets$: Observable<Budget[]> = this.budgetService.getBudgets();
  readonly categories$ = this.categoryService.categories$;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    limit: [500, [Validators.required, Validators.min(50)]],
    period: ['Monthly' as BudgetPeriod, Validators.required],
    categoryIds: [<number[]>[], Validators.required]
  });

  editingBudget?: Budget;
  submitting = false;

  refreshBudgets(): void {
    this.budgets$ = this.budgetService.getBudgets();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, limit, period, categoryIds } = this.form.getRawValue();
    if (!name || !limit || !period || !categoryIds?.length) {
      return;
    }

    this.submitting = true;

    if (this.editingBudget) {
      const updated: Budget = {
        ...this.editingBudget,
        name,
        limit,
        period,
        categoryIds
      };

      this.budgetService.updateBudget(updated).subscribe({
        next: () => {
          this.resetForm();
          this.refreshBudgets();
        },
        complete: () => (this.submitting = false)
      });
    } else {
      this.budgetService
        .createBudget({
          name,
          limit,
          period,
          categoryIds,
          spent: 0,
          resetDay: 1
        })
        .subscribe({
          next: () => {
            this.resetForm();
            this.refreshBudgets();
          },
          complete: () => (this.submitting = false)
        });
    }
  }

  edit(budget: Budget): void {
    this.editingBudget = budget;
    this.form.patchValue({
      name: budget.name,
      limit: budget.limit,
      period: budget.period,
      categoryIds: budget.categoryIds
    });
  }

  delete(budget: Budget): void {
    this.submitting = true;
    this.budgetService.deleteBudget(budget.id).subscribe({
      next: () => this.refreshBudgets(),
      complete: () => {
        this.submitting = false;
        if (this.editingBudget?.id === budget.id) {
          this.resetForm();
        }
      }
    });
  }

  resetForm(): void {
    this.editingBudget = undefined;
    this.submitting = false;
    this.form.reset({
      name: '',
      limit: 500,
      period: 'Monthly',
      categoryIds: []
    });
  }

  labelForCategory(categories: Category[] | null, id: number): string {
    return categories?.find((cat) => cat.id === id)?.name ?? 'Other';
  }

  toggleCategory(categoryId: number, checked: boolean): void {
    const current = this.form.controls.categoryIds.value ?? [];
    const next = checked ? [...current, categoryId] : current.filter((id) => id !== categoryId);
    this.form.controls.categoryIds.setValue(next);
  }

  categoryColor(categories: Category[] | null, id: number): string {
    return categories?.find((cat) => cat.id === id)?.color ?? '#334155';
  }
}
