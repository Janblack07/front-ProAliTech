import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [CardModule],
  templateUrl: './raw-materials.component.html',
  styleUrl: './raw-materials.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RawMaterialsComponent {}
