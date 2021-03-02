import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { AuthenticationService } from '~/core/services/authentication/authentication.service';
import { DestroyObservable } from '~/core/components/destroy-observable';
import { Operator } from '~/core/entities/operator/operator';
import { OperatorStoreService } from '~/modules/operator/services/operator-store.service';
import { DialogService } from '~/core/services/dialog.service';
import { Roles } from '~/core/enums/user/roles';

@Component({
  selector: 'app-operator-list',
  templateUrl: './operator-list.component.html',
  styleUrls: ['./operator-list.component.scss'],
})
export class OperatorListComponent extends DestroyObservable implements OnInit {
  displayedColumns: string[] = ['name', 'actions'];

  @Output() edit = new EventEmitter();
  @Input() operators: Operator[];

  get canEdit(): boolean {
    return this.auth.hasRole([Roles.OperatorAdmin, Roles.RegistryAdmin]);
  }

  get canDelete(): boolean {
    return this.auth.hasRole([Roles.RegistryAdmin]);
  }

  constructor(
    public operatorStoreService: OperatorStoreService,
    public auth: AuthenticationService,
    private _dialogService: DialogService,
    private _toastr: ToastrService,
  ) {
    super();
  }

  ngOnInit(): void {}

  onEdit(operator): void {
    this.edit.emit(operator);
  }

  onDelete(operator): void {
    this._dialogService
      .confirm({
        title: 'Êtes-vous sûr de vouloir supprimer cet opérateur ?',
        confirmBtn: 'Oui',
        cancelBtn: 'Non',
        color: 'warn',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((hasConfirmed) => {
        if (hasConfirmed) {
          this.operatorStoreService.delete(operator).subscribe(
            () => {
              this._toastr.success(`L'opérateur ${operator.name} a été supprimé`);
            },
            (err) => {
              this._toastr.error(err.message);
            },
          );
        }
      });
  }
}
