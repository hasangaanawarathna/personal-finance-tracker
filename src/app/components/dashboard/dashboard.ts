import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category';
import { TransactionService } from '../../services/transaction';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);

  readonly transactions = this.transactionService.transactions;
  readonly totalIncome = this.transactionService.totalIncome;
  readonly totalExpense = this.transactionService.totalExpense;
  readonly balance = this.transactionService.balance;

  readonly recentTransactions = computed(() =>
    this.transactionService.recentTransactions(5)
  );

  getCategoryName(categoryId: string): string {
    return this.categoryService.getCategoryName(categoryId);
  }
}
