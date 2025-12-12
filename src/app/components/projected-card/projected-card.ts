import { Component } from '@angular/core';

@Component({
  selector: 'app-projected-card',
  standalone: true,
  template: `
    <div class="projected-card">
      <header class="projected-card__header">
        <ng-content select="[card-title]"></ng-content>
      </header>
      <div class="projected-card__body">
        <ng-content></ng-content>
      </div>
      <footer class="projected-card__footer">
        <ng-content select="[card-footer]"></ng-content>
      </footer>
    </div>
  `,
  styles: [
    `
      .projected-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px dashed var(--stroke);
        background: rgba(255, 255, 255, 0.03);
      }

      .projected-card__header {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }

      .projected-card__footer {
        border-top: 1px solid var(--stroke);
        padding-top: 8px;
        color: var(--muted);
        font-size: 14px;
      }
    `
  ]
})
export class ProjectedCardComponent {}
