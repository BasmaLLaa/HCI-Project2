import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { CurrencyService } from '../services/currency.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly currencyService = inject(CurrencyService);
  private readonly locale = inject(LOCALE_ID);
  private readonly currencyPipe = new CurrencyPipe(this.locale);

  transform(
    value: number | string | null | undefined,
    digits?: string,
    display: 'code' | 'symbol' | 'symbol-narrow' | string = 'symbol'
  ): string | null {
    const code = this.currencyService.currency();
    return this.currencyPipe.transform(value, code, display, digits);
  }
}
