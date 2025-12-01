import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode: 'login' | 'register' = 'login';
  error = '';
  submitting = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.error = '';
  }

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('register')) {
      this.mode = 'register';
    }
  }

  submit(): void {
    this.error = '';
    this.submitting = true;

    if (this.mode === 'login') {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        this.submitting = false;
        return;
      }
      const { email, password } = this.loginForm.getRawValue();
      this.authService.login(email!, password!).subscribe({
        next: user => {
          if (!user) {
            this.error = 'Invalid credentials';
            return;
          }
          this.router.navigate(['/dashboard']);
        },
        error: () => (this.error = 'Login failed'),
        complete: () => (this.submitting = false)
      });
    } else {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        this.submitting = false;
        return;
      }
      const { name, email, password } = this.registerForm.getRawValue();
      this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => (this.error = 'Registration failed'),
        complete: () => (this.submitting = false)
      });
    }
  }
}
