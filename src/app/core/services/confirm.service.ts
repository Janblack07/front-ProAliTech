import { inject, Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private readonly confirmationService = inject(ConfirmationService);

  confirmDelete(config: {
    message: string;
    header?: string;
    accept: () => void;
    reject?: () => void;
  }): void {
    this.confirmationService.confirm({
      header: config.header ?? 'Confirmar eliminación',
      message: config.message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: config.accept,
      reject: config.reject
    });
  }

  confirmAction(config: {
    message: string;
    header?: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptButtonStyleClass?: string;
    rejectButtonStyleClass?: string;
    accept: () => void;
    reject?: () => void;
  }): void {
    this.confirmationService.confirm({
      header: config.header ?? 'Confirmar acción',
      message: config.message,
      icon: config.icon ?? 'pi pi-question-circle',
      acceptLabel: config.acceptLabel ?? 'Aceptar',
      rejectLabel: config.rejectLabel ?? 'Cancelar',
      acceptButtonStyleClass: config.acceptButtonStyleClass ?? 'p-button-primary',
      rejectButtonStyleClass: config.rejectButtonStyleClass ?? 'p-button-text',
      accept: config.accept,
      reject: config.reject
    });
  }
}
