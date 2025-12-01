import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Category } from '../models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = 'api/categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  readonly categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refresh();
  }

  refresh(): void {
    this.http.get<Category[]>(this.baseUrl).subscribe(cats => this.categoriesSubject.next(cats));
  }

  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    // omit id so the backend generates a new one instead of overwriting the previous item
    return this.http.post<Category>(this.baseUrl, { ...category }).pipe(
      tap(() => this.refresh())
    );
  }
}
