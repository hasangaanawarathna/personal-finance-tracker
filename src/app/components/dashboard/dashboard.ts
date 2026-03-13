import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Transaction } from '../../services/transaction';
import { BudgetService } from '../../services/budget';
import { CategoryService } from '../../services/category';
import { Auth } from '../../services/auth';
import { finalize, forkJoin } from 'rxjs';

export interface TransactionModel {
  id?: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private transactionService = inject(Transaction);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private authService = inject(Auth);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  transactions = signal<TransactionModel[]>([]);
  budgets = this.budgetService.budgets;
  categories = this.categoryService.categories;
  loading = signal(false);
  categorySaving = signal(false);
  addCategoryError = signal<string | null>(null);
  showAddCategoryForm = signal(false);
  currentTime = signal('');
  currentDate = signal('');

  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  private dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  });

  addCategoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['expense' as 'income' | 'expense', Validators.required],
    icon: ['🏷️'],
    color: ['#3b82f6'],
  });

  recentTransactions = computed(() => 
    this.transactions().slice(0, 5)
  );

  totalIncome = computed(() => 
    this.transactions()
      .filter((t: TransactionModel) => t.type === 'income')
      .reduce((sum: number, t: TransactionModel) => sum + t.amount, 0)
  );

  totalExpense = computed(() => 
    this.transactions()
      .filter((t: TransactionModel) => t.type === 'expense')
      .reduce((sum: number, t: TransactionModel) => sum + t.amount, 0)
  );

  balance = computed(() => this.totalIncome() - this.totalExpense());

  budgetStatus = computed(() => 
    this.budgets().map(b => ({
      ...b,
      percentage: b.amount ? Math.min(((b.spent || 0) / b.amount) * 100, 100) : 0,
    })).slice(0, 5)
  );

  categoryBreakdown = computed(() => {
    const breakdown: { [key: string]: number } = {};
    this.transactions()
      .filter((t: TransactionModel) => t.type === 'expense')
      .forEach((t: TransactionModel) => {
        const category = this.categories().find(c => c.id === t.categoryId);
        const name = category?.name || 'Other';
        breakdown[name] = (breakdown[name] || 0) + t.amount;
      });
    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.loadData();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      transactions: this.transactionService.getTransactions(),
      budgets: this.budgetService.getBudgets(),
      categories: this.categoryService.getCategories(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ transactions }) => {
        this.transactions.set(transactions);
      });
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(this.timeFormatter.format(now));
    this.currentDate.set(this.dateFormatter.format(now));
  }

  logout(): void {
    const shouldSignOut = window.confirm('Are you sure you want to sign out?');
    if (!shouldSignOut) {
      return;
    }

    this.authService.clearToken();
    this.router.navigate(['/login']);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Transfer';
  }

  openAddCategoryForm(): void {
    this.addCategoryError.set(null);
    this.addCategoryForm.reset({
      name: '',
      type: 'expense',
      icon: '🏷️',
      color: '#3b82f6',
    });
    this.showAddCategoryForm.set(true);
  }

  closeAddCategoryForm(): void {
    this.showAddCategoryForm.set(false);
    this.addCategoryError.set(null);
  }

  saveCategory(): void {
    if (this.addCategoryForm.invalid) {
      this.addCategoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.addCategoryForm.getRawValue();
    this.categorySaving.set(true);
    this.addCategoryError.set(null);

    this.categoryService
      .createCategory({
        name: formValue.name ?? '',
        type: formValue.type ?? 'expense',
        icon: formValue.icon ?? '🏷️',
        color: formValue.color ?? '#3b82f6',
      })
      .pipe(finalize(() => this.categorySaving.set(false)))
      .subscribe({
        next: () => {
          this.showAddCategoryForm.set(false);
          this.addCategoryForm.reset({
            name: '',
            type: 'expense',
            icon: '🏷️',
            color: '#3b82f6',
          });
        },
        error: () => {
          this.addCategoryError.set('Unable to create category. Please try again.');
        },
      });
  }
}
