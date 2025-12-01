import { AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ReportingService } from '../../services/reporting.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, NgClass, NgFor, NgIf],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent {
  readonly reportingService = inject(ReportingService);

  readonly categorySpend$ = this.reportingService.getSpendByCategory();
  readonly monthly$ = this.reportingService.getMonthlySummaries();
  readonly cashflow$ = this.reportingService.getCashflow();
}
