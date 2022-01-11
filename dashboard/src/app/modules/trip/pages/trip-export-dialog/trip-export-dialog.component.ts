import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { get } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { DestroyObservable } from '~/core/components/destroy-observable';
import { CommonDataService } from '~/core/services/common-data.service';
// eslint-disable-next-line max-len
import { ListOperatorItem } from '../../../operator/modules/operator-ui/components/operators-checkboxes/operators-checkboxes.component';
import { TripExportParamWithOperators } from '../trip-export/trip-export.component';

@Component({
  selector: 'app-trip-export-dialog',
  templateUrl: './trip-export-dialog.component.html',
  styleUrls: ['./trip-export-dialog.component.scss'],
})
export class TripExportDialogComponent extends DestroyObservable implements OnInit {
  private territories: { _id: number; name: string }[];
  private operators_count: number;

  // helper for display
  get hasProps() {
    return Object.keys(this.props).length;
  }

  /**
   * Build the properties table with start, end and operator
   */
  get props(): { [k: string]: string } {
    const p = {};
    const s = get(this.data, 'date.start');
    const e = get(this.data, 'date.end');
    const o: ListOperatorItem[] = get(this.data, 'operators', []);
    const t: number[] = get(this.data, 'territory_ids_filter', []);

    if (s) p['Début'] = format(this.castDate(s), 'PPPP', { locale: fr });
    if (e) p['Fin'] = format(this.castDate(e), 'PPPP', { locale: fr });
    if (t && t.length !== 0)
      p['Territoires'] = this.territories
        .filter((ter) => t.indexOf(ter._id) > -1)
        .map((ter) => ter.name)
        .sort()
        .join(', ')
        .trim();
    if (o.length === this.operators_count) {
      p['Opérateurs'] = 'tous';
    } else if (o.length) {
      p[`Opérateur${o.length === 1 ? '' : 's'}`] = o
        .map((op) => op.name)
        .sort()
        .join(', ')
        .trim();
    }

    return p;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: TripExportParamWithOperators,
    private dialogRef: MatDialogRef<TripExportDialogComponent>,
    private commonDataService: CommonDataService,
  ) {
    super();
  }

  ngOnInit() {
    this.operators_count = this.commonDataService.operators.length;
    this.commonDataService.territories$.pipe(takeUntil(this.destroy$)).subscribe((territories) => {
      this.territories = territories.map(({ _id, name }) => ({ _id, name }));
    });
  }

  public accept(): void {
    this.dialogRef.close(true);
  }

  public decline(): void {
    this.dialogRef.close(false);
  }

  private castDate(i: any): Date {
    if ('toDate' in i) return i.toDate();
    return new Date(i);
  }
}
