import { Routes } from '@angular/router';

import { Budget } from './components/budget/budget';
import { CategoriesComponent } from './components/categories/categories';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { TransactionsComponent } from './components/transactions/transactions';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'budget', component: Budget },
  { path: '**', redirectTo: 'dashboard' },
];
