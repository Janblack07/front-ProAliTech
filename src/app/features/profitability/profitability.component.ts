import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CardModule],
  templateUrl: './profitability.component.html',
  styleUrl: './profitability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfitabilityComponent {}
