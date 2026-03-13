import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryService, Category } from '../../services/category';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private authService = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  categories = this.categoryService.categories;
  loading = this.categoryService.loading;
  error = this.categoryService.error;
  
  showModal = signal(false);
  editingCategory = signal<Category | null>(null);
  toastMessage = signal<string | null>(null);
  isEditing = computed(() => this.editingCategory() !== null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  incomeCategories = computed(() => 
    this.categories().filter(cat => cat.type === 'income')
  );
  
  expenseCategories = computed(() => 
    this.categories().filter(cat => cat.type === 'expense')
  );

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['expense' as 'income' | 'expense', Validators.required],
    color: ['#3b82f6'],
    icon: ['💰'],
  });

  colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  iconOptions = [
    '💰', '🏠', '🚗', '🍔', '🎮', '💊', '🎓', '✈️',
    '👕', '📱', '💡', '🎬', '📚', '🎵', '🏋️', '🎨'
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('action') === 'create' && !this.showModal()) {
        this.openCreateModal();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { action: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.clearToastTimer();
  }

  loadCategories(force = false): void {
    this.categoryService.getCategories(force).subscribe();
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({
      name: '',
      type: 'expense',
      color: '#3b82f6',
      icon: '💰',
    });
    this.showModal.set(true);
  }

  openEditModal(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type,
      color: category.color || '#3b82f6',
      icon: category.icon || '💰',
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;
    const categoryData = {
      name: formValue.name!,
      type: formValue.type!,
      color: formValue.color!,
      icon: formValue.icon!,
    };

    const editing = this.editingCategory();
    if (editing && editing.id) {
      this.categoryService.updateCategory(editing.id, categoryData).subscribe({
        next: () => {
          this.loadCategories(true);
          this.closeModal();
          this.showToast('Category updated successfully.');
        },
      });
    } else {
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.loadCategories(true);
          this.closeModal();
          this.showToast('Category added successfully.');
        },
      });
    }
  }

  deleteCategory(category: Category): void {
    if (!category.id) return;
    
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe();
    }
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.clearToastTimer();
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, 3000);
  }

  private clearToastTimer(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.clearToken();
      this.router.navigate(['/login']);
    }
  }
}
