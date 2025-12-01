import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';

import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'api/users';
  readonly currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('bt_user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    return this.http.get<User[]>(this.baseUrl).pipe(
      map(users =>
        users.find(
          u => u.email.trim().toLowerCase() === normalizedEmail && u.password === password
        ) ?? null
      ),
      tap(user => {
        if (user) {
          this.currentUser.set(user);
          localStorage.setItem('bt_user', JSON.stringify(user));
        }
      })
    );
  }

  register(payload: Omit<User, 'id'>) {
    return this.http.post<User>(this.baseUrl, { ...payload, id: 0 }).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('bt_user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('bt_user');
  }
}
