import { AsyncPipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Category, CategoryType } from '../../models/category';
import { ProfileSettings } from '../../models/profile-settings';
import { CategoryService } from '../../services/category.service';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, ReactiveFormsModule, TitleCasePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  profileForm = this.fb.group({
    id: [1],
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    currency: ['USD', Validators.required],
    savingsGoal: [2000, [Validators.required, Validators.min(0)]],
    monthlyTarget: [1200, [Validators.required, Validators.min(0)]],
    notifications: [true]
  });

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    color: ['#22c55e', Validators.required],
    type: ['expense' as CategoryType, Validators.required]
  });

  categories$ = this.categoryService.categories$;
  savingProfile = false;
  savingCategory = false;
  lockUserFields = false;

  ngOnInit(): void {
    this.syncUserDetails();
    this.settingsService.getProfile().subscribe((profile: ProfileSettings) => {
      this.profileForm.patchValue(profile);
      this.syncUserDetails();
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.settingsService.updateProfile(this.profileForm.getRawValue() as ProfileSettings).subscribe({
      complete: () => (this.savingProfile = false)
    });
  }

  addCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const raw = this.categoryForm.getRawValue();
    const name = (raw.name ?? '').trim();
    if (!name) {
      this.categoryForm.controls.name.setErrors({ required: true });
      return;
    }

    this.savingCategory = true;
    this.categoryService
      .createCategory({
        name,
        color: raw.color ?? '#22c55e',
        type: raw.type ?? 'expense'
      } as Omit<Category, 'id'>)
      .subscribe({
      next: () => {
        this.categoryForm.reset({ name: '', color: '#22c55e', type: 'expense' });
      },
      complete: () => (this.savingCategory = false)
    });
  }

  private syncUserDetails(): void {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    this.profileForm.patchValue({
      name: user.name,
      email: user.email
    });
    this.profileForm.controls.name.disable({ emitEvent: false });
    this.profileForm.controls.email.disable({ emitEvent: false });
    this.lockUserFields = true;
  }
}
