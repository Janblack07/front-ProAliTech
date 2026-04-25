import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

import { ApiResponse } from '../../core/models/api-response.model';
import {
  UserItem,
  UserListData,
  UserPayload
} from '../../core/models/user.model';
import {
  UserQueryParams,
  UserService
} from './data/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;

  if (!password && !confirmation) return null;
  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    TagModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly users = signal<UserItem[]>([]);
  readonly roleOptions = signal<Array<{ id: number; name: string }>>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly dialogVisible = signal(false);
  readonly editingUser = signal<UserItem | null>(null);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      lastname: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.maxLength(20)]],
      password: [''],
      password_confirmation: [''],
      status: true,
      roles: [[] as string[]]
    },
    { validators: passwordMatchValidator }
  );

  constructor() {
    this.loadUsers();
    this.loadRoles();
  }

  get isEditMode(): boolean {
    return !!this.editingUser();
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving();
  }

  get rolesControl() {
    return this.form.controls.roles;
  }

  loadUsers(page = this.currentPage()): void {
    this.loading.set(true);

    const params: UserQueryParams = {
      search: this.search(),
      status: this.statusFilter(),
      page,
      per_page: this.rows()
    };

    this.userService
      .getUsers(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<UserListData>) => {
          this.users.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar los usuarios.'
          );
        }
      });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (response: ApiResponse<Array<{ id: number; name: string }>>) => {
        this.roleOptions.set(response.data);
      }
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
  }

  applyFilters(): void {
    this.loadUsers(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.loadUsers(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadUsers(nextPage);
  }

  toggleRole(roleName: string, checked: boolean): void {
    const current = [...this.rolesControl.value];

    if (checked) {
      if (!current.includes(roleName)) {
        current.push(roleName);
      }
    } else {
      const filtered = current.filter(role => role !== roleName);
      this.rolesControl.setValue(filtered);
      this.rolesControl.markAsDirty();
      return;
    }

    this.rolesControl.setValue(current);
    this.rolesControl.markAsDirty();
  }

  hasRole(roleName: string): boolean {
    return this.rolesControl.value.includes(roleName);
  }

  openCreateDialog(): void {
    this.editingUser.set(null);
    this.form.reset({
      name: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      status: true,
      roles: []
    });
    this.dialogVisible.set(true);
  }

  openEditDialog(user: UserItem): void {
    this.editingUser.set(user);
    this.form.reset({
      name: user.name,
      lastname: user.lastname ?? '',
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      password_confirmation: '',
      status: user.status,
      roles: user.roles.map(role => role.name)
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingUser.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warn(
        'Formulario incompleto',
        'Revisa los campos obligatorios antes de continuar.'
      );
      return;
    }

    if (!this.rolesControl.value.length) {
      this.notificationService.warn(
        'Roles requeridos',
        'Debes seleccionar al menos un rol.'
      );
      return;
    }

    this.saving.set(true);

    const raw = this.form.getRawValue();

    const payload: UserPayload = {
      name: raw.name.trim(),
      lastname: raw.lastname?.trim() ? raw.lastname.trim() : null,
      email: raw.email.trim(),
      phone: raw.phone?.trim() ? raw.phone.trim() : null,
      status: raw.status,
      roles: raw.roles,
      password: raw.password?.trim() ? raw.password.trim() : null,
      password_confirmation: raw.password_confirmation?.trim()
        ? raw.password_confirmation.trim()
        : null
    };

    if (this.isEditMode && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }

    const request$ = this.isEditMode
      ? this.userService.updateUser(this.editingUser()!.id, payload)
      : this.userService.createUser(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<UserItem>) => {
          this.notificationService.success(
            this.isEditMode ? 'Usuario actualizado' : 'Usuario creado',
            response.message
          );
          this.closeDialog();
          this.loadUsers(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible guardar el usuario.'
          );
        }
      });
  }

  deleteUser(user: UserItem): void {
    this.confirmService.confirmDelete({
      message: `¿Deseas eliminar el usuario "${user.full_name}"? Esta acción no se puede deshacer.`,
      accept: () => {
        this.loading.set(true);

        this.userService
          .deleteUser(user.id)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (response: ApiResponse<null>) => {
              this.notificationService.success(
                'Usuario eliminado',
                response.message
              );
              this.loadUsers(this.currentPage());
            },
            error: (error: unknown) => {
              this.notificationService.error(
                'Error al eliminar',
                this.getErrorMessage(error) ?? 'No fue posible eliminar el usuario.'
              );
            }
          });
      }
    });
  }

  private getErrorMessage(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: unknown }).error === 'object' &&
      (error as { error?: unknown }).error !== null &&
      'message' in ((error as { error: { message?: unknown } }).error) &&
      typeof (error as { error: { message?: unknown } }).error.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    return null;
  }
}
