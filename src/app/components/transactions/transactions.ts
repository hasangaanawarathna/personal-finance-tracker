import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category';
import { TransactionModel, TransactionService } from '../../services/transaction';

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);

  readonly categories = this.categoryService.categories;
  readonly transactions = this.transactionService.transactions;

  readonly transactionForm = this.fb.group({
    title: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['income' as 'income' | 'expense', [Validators.required]],
    categoryId: ['', [Validators.required]],
    date: [this.getToday(), [Validators.required]],
  });

  readonly availableCategories = computed(() => {
    const type = this.transactionForm.controls.type.value;
    return this.categories().filter((item) => item.type === type);
  });

  onTypeChange(): void {
    this.transactionForm.patchValue({ categoryId: '' });
  }

  submit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const value = this.transactionForm.getRawValue();
    this.transactionService.addTransaction({
      title: value.title ?? '',
      amount: Number(value.amount),
      type: value.type ?? 'income',
      categoryId: value.categoryId ?? '',
      date: value.date ?? this.getToday(),
    });

    this.transactionForm.reset({
      title: '',
      amount: 0,
      type: 'income',
      categoryId: '',
      date: this.getToday(),
    });
  }

  deleteTransaction(item: TransactionModel): void {
    this.transactionService.deleteTransaction(item.id);
  }

  getCategoryName(categoryId: string): string {
    return this.categoryService.getCategoryName(categoryId);
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
