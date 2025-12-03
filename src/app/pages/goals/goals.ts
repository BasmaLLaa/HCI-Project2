import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';

import { Goal } from '../../models/goal';
import { Category } from '../../models/category';
import { GoalService } from '../../services/goal.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, FormsModule, NgFor, NgIf, NgStyle, ReactiveFormsModule],
  templateUrl: './goals.html',
  styleUrl: './goals.scss'
})
export class GoalsComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private goalService = inject(GoalService);
  private categoryService = inject(CategoryService);
  private destroy$ = new Subject<void>();

  goals$: Observable<Goal[]> = this.goalService.getGoals();
  categories$ = this.categoryService.categories$;
  submitting = false;
  editing?: Goal;
  filterText = '';
  goalCount = 0;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    targetAmount: [500, [Validators.required, Validators.min(50)]],
    currentAmount: [0, [Validators.required, Validators.min(0)]],
    dueDate: [''],
    categoryId: [null as number | null],
    note: ['']
  });

  constructor() {
    this.goalService
      .getGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe((goals) => (this.goalCount = goals.length));
  }

  refresh(): void {
    this.goals$ = this.goalService.getGoals();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    this.submitting = true;

    if (this.editing) {
      const updated: Goal = {
        ...this.editing,
        title: payload.title ?? '',
        targetAmount: Number(payload.targetAmount),
        currentAmount: Number(payload.currentAmount),
        dueDate: payload.dueDate || undefined,
        categoryId: payload.categoryId ?? undefined,
        note: payload.note || ''
      };
      this.goalService.updateGoal(updated).subscribe({
        next: () => {
          this.reset();
          this.refresh();
        },
        complete: () => (this.submitting = false)
      });
    } else {
      this.goalService
        .createGoal({
          title: payload.title ?? '',
          targetAmount: Number(payload.targetAmount),
          currentAmount: Number(payload.currentAmount),
          dueDate: payload.dueDate || undefined,
          categoryId: payload.categoryId ?? undefined,
          note: payload.note || ''
        })
        .subscribe({
          next: () => {
            this.reset();
            this.refresh();
          },
          complete: () => (this.submitting = false)
        });
    }
  }

  edit(goal: Goal): void {
    this.editing = goal;
    this.form.patchValue({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      dueDate: goal.dueDate ?? '',
      categoryId: goal.categoryId ?? null,
      note: goal.note ?? ''
    });
  }

  delete(goal: Goal): void {
    this.submitting = true;
    this.goalService.deleteGoal(goal.id).subscribe({
      next: () => this.refresh(),
      complete: () => {
        this.submitting = false;
        if (this.editing?.id === goal.id) {
          this.reset();
        }
      }
    });
  }

  reset(): void {
    this.editing = undefined;
    this.submitting = false;
    this.form.reset({
      title: '',
      targetAmount: 500,
      currentAmount: 0,
      dueDate: '',
      categoryId: null,
      note: ''
    });
  }

  progress(goal: Goal): number {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  addContribution(goal: Goal, amountInput: number | null | undefined): void {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    this.submitting = true;
    const updated: Goal = { ...goal, currentAmount: goal.currentAmount + amount };
    this.goalService.updateGoal(updated).subscribe({
      next: () => this.refresh(),
      complete: () => (this.submitting = false)
    });
  }

  filterGoals(goals: Goal[]): Goal[] {
    const term = this.filterText.trim().toLowerCase();
    if (!term) {
      return goals;
    }
    return goals.filter((g) => g.title.toLowerCase().includes(term));
  }

  trackByGoal(index: number, goal: Goal): number {
    return goal.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
