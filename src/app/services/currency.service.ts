import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly storageKey = 'bt_currency';
  private readonly currencySignal = signal<string>(this.loadInitial());

  currency(): string {
    return this.currencySignal();
  }

  setCurrency(code: string): void {
    const normalized = code?.trim().toUpperCase() || 'USD';
    this.currencySignal.set(normalized);
    localStorage.setItem(this.storageKey, normalized);
  }

  private loadInitial(): string {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? saved : 'USD';
  }
}
