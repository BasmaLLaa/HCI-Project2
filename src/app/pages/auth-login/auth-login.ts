import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './auth-login.html',
  styleUrl: './auth-login.scss'
})
export class AuthLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = '';
  submitting = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.submitting = true;
    this.authService.login(email!, password!).subscribe({
      next: (user) => {
        if (!user) {
          this.error = 'Invalid credentials';
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: () => (this.error = 'Login failed'),
      complete: () => (this.submitting = false)
    });
  }
}
