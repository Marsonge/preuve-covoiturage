import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatPaginatorModule } from '@angular/material/paginator';

// eslint-disable-next-line
import { OperatorImportComponent } from '~/modules/operator/modules/operator-ui/components/operator-import/operator-import.component';

import { OperatorsAutocompleteComponent } from './components/operators-autocomplete/operators-autocomplete.component';
import { OperatorFormComponent } from './components/operator-form/operator-form.component';
import { OperatorAutocompleteComponent } from './components/operator-autocomplete/operator-autocomplete.component';
import { OperatorListViewComponent } from './components/operator-list-view/operator-list-view.component';
import { OperatorListComponent } from './components/operator-list/operator-list.component';
import { OperatorFilterComponent } from './components/operator-filter/operator-filter.component';
import { OperatorDetailsComponent } from './components/operator-details/operator-details.component';
import { OperatorLogoUploadComponent } from './components/operator-logo-upload/operator-logo-upload.component';
import { OperatorsCheckboxesComponent } from './components/operators-checkboxes/operators-checkboxes.component';
import { DetailsModule } from '../../../../shared/modules/details/details.module';
import { FormModule } from '../../../../shared/modules/form/form.module';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  declarations: [
    OperatorsAutocompleteComponent,
    OperatorFormComponent,
    OperatorImportComponent,
    OperatorAutocompleteComponent,
    OperatorListViewComponent,
    OperatorListComponent,
    OperatorFilterComponent,
    OperatorDetailsComponent,
    OperatorLogoUploadComponent,
    OperatorsCheckboxesComponent,
  ],
  exports: [
    OperatorsAutocompleteComponent,
    OperatorsCheckboxesComponent,
    OperatorFormComponent,
    OperatorAutocompleteComponent,
    OperatorListViewComponent,
    OperatorDetailsComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    FormModule,
    SharedModule,
    DetailsModule,
    MatGridListModule,
    MatPaginatorModule,
  ],
})
export class OperatorUiModule {}
