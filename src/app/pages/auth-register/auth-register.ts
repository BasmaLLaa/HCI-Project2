import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './auth-register.html',
  styleUrl: './auth-register.scss'
})
export class AuthRegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = '';
  submitting = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    this.submitting = true;
    this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => (this.error = 'Registration failed'),
      complete: () => (this.submitting = false)
    });
  }
}
