import { Observable, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { JsonRpcCrud } from '~/core/services/api/json-rpc.crud';
import { User } from '~/core/entities/authentication/user';
import { catchHttpStatus } from '~/core/operators/catchHttpStatus';
import { UserPatchInterface } from '~/core/entities/api/shared/user/common/interfaces/UserPatchInterface';
import { UserListInterface } from '~/core/entities/api/shared/user/common/interfaces/UserListInterface';
import { UserInterface } from '~/core/interfaces/user/profileInterface';

@Injectable({
  providedIn: 'root',
})
export class UserApiService extends JsonRpcCrud<User, UserListInterface, UserPatchInterface> {
  constructor(http: HttpClient, router: Router, activatedRoute: ActivatedRoute, protected _toastr: ToastrService) {
    super(http, router, activatedRoute, 'user');
  }

  me(): Observable<User> {
    return this.http
      .get<UserInterface | null>('profile', { withCredentials: true })
      .pipe(
        catchError(() => of(null)),
        map((data) => (data ? new User(data) : null)),
        shareReplay(),
      );
  }

  protected catchEmailConflict<T>(obs$: Observable<T>): Observable<T> {
    return obs$.pipe(
      catchHttpStatus(409, (err) => {
        this._toastr.error("L'email est déjà utilisé");
        throw err;
      }),
    );
  }

  patch(id: number, patch: UserPatchInterface): Observable<any> {
    return this.catchEmailConflict(super.patch(id, patch));
  }

  create(item: User): Observable<User> {
    return this.catchEmailConflict(super.create(item));
  }

  update(item: User): Observable<User> {
    return this.catchEmailConflict(super.update(item));
  }
}
