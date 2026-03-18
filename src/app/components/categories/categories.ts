import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryService } from '../../services/category';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  readonly categories = this.categoryService.categories;

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required]],
    type: ['expense' as 'income' | 'expense', [Validators.required]],
  });

  submit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    this.categoryService.addCategory({
      name: value.name ?? '',
      type: value.type ?? 'expense',
    });

    this.categoryForm.reset({
      name: '',
      type: 'expense',
    });
  }

  deleteCategory(item: Category): void {
    this.categoryService.deleteCategory(item.id);
  }
}
