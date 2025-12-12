import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';

import { ProjectedCardComponent } from '../../components/projected-card/projected-card';
import { Budget } from '../../models/budget';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-budget-detail',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink, ProjectedCardComponent],
  templateUrl: './budget-detail.html',
  styleUrl: './budget-detail.scss'
})
export class BudgetDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);

  readonly categories$ = this.categoryService.categories$;

  readonly budget$ = combineLatest([this.budgetService.getBudgets(), this.route.paramMap]).pipe(
    map(([budgets, params]) => {
      const id = Number(params.get('id'));
      return budgets.find((b) => b.id === id) ?? null;
    })
  );

  goBack(): void {
    this.router.navigate(['/budgets']);
  }

  categoryName(id: number, categories: { id: number; name: string }[]): string {
    return categories.find((c) => c.id === id)?.name ?? 'Category';
  }
}
