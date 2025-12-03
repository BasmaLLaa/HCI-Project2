import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [NgStyle],
  template: `
    <button
      type="button"
      class="status-pill"
      [ngStyle]="{
        background: resolvedBackground,
        color: resolvedText,
        borderColor: resolvedBorder
      }"
      (click)="pillClick.emit()"
    >
      <span class="dot" [style.background]="resolvedDot"></span>
      <span class="label">{{ label }}</span>
    </button>
  `,
  styles: [
    `
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-weight: 700;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 160ms ease;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      .status-pill:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }
    `
  ]
})
export class StatusPillComponent {
  @Input() label = '';
  @Input() type: 'income' | 'expense' | 'neutral' = 'neutral';

  @Output() pillClick = new EventEmitter<void>();

  get resolvedBackground(): string {
    if (this.type === 'income') {
      return 'rgba(34, 197, 94, 0.14)';
    }
    if (this.type === 'expense') {
      return 'rgba(124, 58, 237, 0.16)';
    }
    return 'rgba(255, 255, 255, 0.08)';
  }

  get resolvedText(): string {
    return '#0f172a';
  }

  get resolvedBorder(): string {
    if (this.type === 'income') {
      return 'rgba(34, 197, 94, 0.45)';
    }
    if (this.type === 'expense') {
      return 'rgba(124, 58, 237, 0.45)';
    }
    return 'rgba(0, 0, 0, 0.08)';
  }

  get resolvedDot(): string {
    if (this.type === 'income') {
      return '#22c55e';
    }
    if (this.type === 'expense') {
      return '#7c3aed';
    }
    return '#94a3b8';
  }
}
