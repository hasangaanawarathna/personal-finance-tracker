import { Injectable, computed, signal } from '@angular/core';

export interface TransactionModel {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly storageKey = 'pft_transactions';

  readonly transactions = signal<TransactionModel[]>([]);

  readonly totalIncome = computed(() =>
    this.transactions()
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0)
  );

  readonly totalExpense = computed(() =>
    this.transactions()
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)
  );

  readonly balance = computed(() => this.totalIncome() - this.totalExpense());

  constructor() {
    this.loadTransactions();
  }

  loadTransactions(): void {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      this.transactions.set([]);
      return;
    }

    try {
      this.transactions.set(JSON.parse(stored) as TransactionModel[]);
    } catch {
      this.transactions.set([]);
      this.save();
    }
  }

  addTransaction(payload: Omit<TransactionModel, 'id'>): void {
    const next: TransactionModel = {
      ...payload,
      id: this.generateId(),
      title: payload.title.trim(),
      amount: Number(payload.amount),
    };

    this.transactions.update((items) => [next, ...items]);
    this.save();
  }

  deleteTransaction(id: string): void {
    this.transactions.update((items) => items.filter((item) => item.id !== id));
    this.save();
  }

  recentTransactions(limit = 5): TransactionModel[] {
    return this.transactions().slice(0, limit);
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.transactions()));
  }

  private generateId(): string {
    return `t_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}
