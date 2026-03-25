import { Routes } from '@angular/router';

import { Budget } from './components/budget/budget';
import { CategoriesComponent } from './components/categories/categories';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { TransactionsComponent } from './components/transactions/transactions';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'budget', component: Budget, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
