import { Routes } from '@angular/router';

import { DashboardComponent } from './components/dashboard/dashboard';
import { TransactionsComponent } from './components/transactions/transactions';
import { CategoriesComponent } from './components/categories/categories';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: '**', redirectTo: 'dashboard' },
];
