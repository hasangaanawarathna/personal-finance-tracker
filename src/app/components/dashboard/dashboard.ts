import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { Auth } from '../../services/auth';
import { BudgetService } from '../../services/budget';
import { CategoryService } from '../../services/category';
import { Transaction } from '../../services/transaction';

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
  categoryToastMessage = signal<string | null>(null);
  currentTime = signal('');
  currentDate = signal('');

  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private categoryToastTimer: ReturnType<typeof setTimeout> | null = null;
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
    icon: ['\u{1F4B0}', Validators.required],
    color: ['#3b82f6', Validators.required],
  });

  colorOptions = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ];

  iconOptions = [
    '\u{1F4B0}',
    '\u{1F3E0}',
    '\u{1F697}',
    '\u{1F354}',
    '\u{1F3AE}',
    '\u{1F48A}',
    '\u{1F393}',
    '\u{2708}\u{FE0F}',
    '\u{1F455}',
    '\u{1F4F1}',
    '\u{1F4A1}',
    '\u{1F3AC}',
  ];

  recentTransactions = computed(() => this.transactions().slice(0, 5));

  totalIncome = computed(() =>
    this.transactions()
      .filter((transaction: TransactionModel) => transaction.type === 'income')
      .reduce(
        (sum: number, transaction: TransactionModel) => sum + transaction.amount,
        0
      )
  );

  totalExpense = computed(() =>
    this.transactions()
      .filter((transaction: TransactionModel) => transaction.type === 'expense')
      .reduce(
        (sum: number, transaction: TransactionModel) => sum + transaction.amount,
        0
      )
  );

  balance = computed(() => this.totalIncome() - this.totalExpense());

  budgetStatus = computed(() =>
    this.budgets()
      .map((budget) => ({
        ...budget,
        percentage: budget.amount
          ? Math.min(((budget.spent || 0) / budget.amount) * 100, 100)
          : 0,
      }))
      .slice(0, 5)
  );

  categoryBreakdown = computed(() => {
    const breakdown: Record<string, number> = {};

    this.transactions()
      .filter((transaction: TransactionModel) => transaction.type === 'expense')
      .forEach((transaction: TransactionModel) => {
        const category = this.categories().find(
          (item) => item.id === transaction.categoryId
        );
        const name = category?.name || 'Other';
        breakdown[name] = (breakdown[name] || 0) + transaction.amount;
      });

    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((left, right) => right.amount - left.amount)
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

    this.clearCategoryToastTimer();
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

  logout(): void {
    const shouldSignOut = window.confirm('Are you sure you want to sign out?');
    if (!shouldSignOut) {
      return;
    }

    this.authService.clearToken();
    this.router.navigate(['/login']);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) {
      return 'danger';
    }
    if (percentage >= 80) {
      return 'warning';
    }
    return 'success';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find((item) => item.id === categoryId);
    return category?.name || 'Transfer';
  }

  openAddCategoryForm(): void {
    this.addCategoryError.set(null);
    this.addCategoryForm.reset({
      name: '',
      type: 'expense',
      icon: '\u{1F4B0}',
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
    const normalizedName = (formValue.name ?? '').trim();
    const selectedType = formValue.type ?? 'expense';

    const duplicateCategory = this.categories().find((category) => {
      return (
        category.type === selectedType &&
        category.name.trim().toLowerCase() === normalizedName.toLowerCase()
      );
    });

    if (duplicateCategory) {
      this.addCategoryError.set(
        'A category with this name already exists for that type.'
      );
      return;
    }

    this.categorySaving.set(true);
    this.addCategoryError.set(null);

    this.categoryService
      .createCategory({
        name: normalizedName,
        type: selectedType,
        icon: formValue.icon ?? '\u{1F4B0}',
        color: formValue.color ?? '#3b82f6',
      })
      .pipe(finalize(() => this.categorySaving.set(false)))
      .subscribe({
        next: () => {
          this.showAddCategoryForm.set(false);
          this.addCategoryForm.reset({
            name: '',
            type: 'expense',
            icon: '\u{1F4B0}',
            color: '#3b82f6',
          });
          this.showCategoryToast('Category added successfully.');
        },
        error: () => {
          this.addCategoryError.set(
            'Unable to create category. Please try again.'
          );
        },
      });
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(this.timeFormatter.format(now));
    this.currentDate.set(this.dateFormatter.format(now));
  }

  private showCategoryToast(message: string): void {
    this.categoryToastMessage.set(message);
    this.clearCategoryToastTimer();
    this.categoryToastTimer = setTimeout(() => {
      this.categoryToastMessage.set(null);
      this.categoryToastTimer = null;
    }, 3000);
  }

  private clearCategoryToastTimer(): void {
    if (this.categoryToastTimer) {
      clearTimeout(this.categoryToastTimer);
      this.categoryToastTimer = null;
    }
  }
}
