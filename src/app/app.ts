import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCUMENT, NgFor, NgIf, AsyncPipe, CurrencyPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ReportingService } from './services/reporting.service';
import { BudgetService } from './services/budget.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor, AsyncPipe, CurrencyPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private reportingService = inject(ReportingService);
  private budgetService = inject(BudgetService);
  readonly navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/budgets', label: 'Budgets' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/reports', label: 'Reports' },
    { path: '/goals', label: 'Goals' },
    { path: '/settings', label: 'Settings' }
  ];
  readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Guest');
  readonly isLoggedIn = computed(() => Boolean(this.auth.currentUser()));
  readonly showShell = computed(() => !this.router.url.startsWith('/auth'));
  readonly theme = signal<'dark' | 'light'>('dark');
  readonly heroKpis$ = combineLatest([
    this.reportingService.getCashflow(),
    this.budgetService.getBudgets()
  ]).pipe(
    map(([cash, budgets]) => ({
      income: cash.income,
      expenses: cash.expenses,
      activeBudgets: budgets.length
    }))
  );

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('bt_theme');
    if (saved === 'light' || saved === 'dark') {
      this.theme.set(saved);
    }
    this.applyTheme();
  }

  toggleTheme(lightOn: boolean): void {
    this.theme.set(lightOn ? 'light' : 'dark');
    localStorage.setItem('bt_theme', this.theme());
    this.applyTheme();
  }

  private applyTheme(): void {
    const body = this.document.body;
    if (this.theme() === 'light') {
      body.classList.add('theme-light');
    } else {
      body.classList.remove('theme-light');
    }
  }

  login(): void {
    this.router.navigate(['/auth/login']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  gotoRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
