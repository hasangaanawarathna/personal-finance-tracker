import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly storageKey = 'pft_categories';

  readonly categories = signal<Category[]>([]);

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      const defaults: Category[] = [
        { id: 'c1', name: 'Salary', type: 'income', icon: 'IN' },
        { id: 'c2', name: 'Freelance', type: 'income', icon: 'IN' },
        { id: 'c3', name: 'Food', type: 'expense', icon: 'EX' },
        { id: 'c4', name: 'Transport', type: 'expense', icon: 'EX' },
      ];
      this.categories.set(defaults);
      this.save();
      return;
    }

    try {
      this.categories.set(JSON.parse(stored) as Category[]);
    } catch {
      this.categories.set([]);
      this.save();
    }
  }

  addCategory(payload: { name: string; type: 'income' | 'expense' }): void {
    const next: Category = {
      id: this.generateId(),
      name: payload.name.trim(),
      type: payload.type,
      icon: payload.type === 'income' ? 'IN' : 'EX',
    };

    this.categories.update((items) => [...items, next]);
    this.save();
  }

  deleteCategory(id: string): void {
    this.categories.update((items) => items.filter((item) => item.id !== id));
    this.save();
  }

  getCategories(): Observable<Category[]> {
    return of(this.categories());
  }

  createCategory(payload: Omit<Category, 'id'>): Observable<Category> {
    const next: Category = {
      id: this.generateId(),
      name: payload.name.trim(),
      type: payload.type,
      icon: payload.icon ?? (payload.type === 'income' ? 'IN' : 'EX'),
      color: payload.color,
    };
    this.categories.update((items) => [...items, next]);
    this.save();
    return of(next);
  }

  updateCategory(id: string, payload: Partial<Category>): Observable<Category> {
    let updated: Category = { id, name: '', type: 'expense' };
    this.categories.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        updated = { ...item, ...payload, id };
        return updated;
      })
    );
    this.save();
    return of(updated);
  }

  deleteCategoryById(id: string): Observable<void> {
    this.deleteCategory(id);
    return of(void 0);
  }

  getCategoryName(id: string): string {
    return this.categories().find((item) => item.id === id)?.name ?? 'Unknown';
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.categories()));
  }

  private generateId(): string {
    return `c_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}
