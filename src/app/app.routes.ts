import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { BudgetsComponent } from './pages/budgets/budgets';
import { TransactionsComponent } from './pages/transactions/transactions';
import { ReportsComponent } from './pages/reports/reports';
import { SettingsComponent } from './pages/settings/settings';
import { GoalsComponent } from './pages/goals/goals';
import { AuthLoginComponent } from './pages/auth-login/auth-login';
import { AuthRegisterComponent } from './pages/auth-register/auth-register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard', canActivate: [authGuard] },
  { path: 'budgets', component: BudgetsComponent, title: 'Budgets', canActivate: [authGuard] },
  { path: 'transactions', component: TransactionsComponent, title: 'Transactions', canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, title: 'Reports', canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, title: 'Settings', canActivate: [authGuard] },
  { path: 'goals', component: GoalsComponent, title: 'Goals', canActivate: [authGuard] },
  { path: 'auth', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'auth/login', component: AuthLoginComponent, title: 'Login' },
  { path: 'auth/register', component: AuthRegisterComponent, title: 'Register' },
  { path: '**', redirectTo: 'dashboard' }
];
