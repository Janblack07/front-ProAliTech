import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-product-ideas',
  standalone: true,
  imports: [CardModule],
  templateUrl: './product-ideas.component.html',
  styleUrl: './product-ideas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductIdeasComponent {}
