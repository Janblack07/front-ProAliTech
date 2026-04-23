import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-productions',
  standalone: true,
  imports: [CardModule],
  templateUrl: './productions.component.html',
  styleUrl: './productions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionsComponent {}
