import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CampaignUiModule } from '~/modules/campaign/modules/campaign-ui/campaign-ui.module';
import { OperatorUiModule } from '~/modules/operator/modules/operator-ui/operator-ui.module';
import { TerritoryUiModule } from '~/modules/territory/modules/territory-ui/territory-ui.module';
import { CampaignModule } from '~/modules/campaign/campaign.module';

import { FilterComponent } from './components/filter/filter.component';
import { TownsAutocompleteComponent } from './components/towns-autocomplete/towns-autocomplete.component';
import { MaterialModule } from '../../shared/modules/material/material.module';

@NgModule({
  declarations: [FilterComponent, TownsAutocompleteComponent],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CampaignUiModule,
    OperatorUiModule,
    TerritoryUiModule,
    CampaignModule,
  ],
  exports: [FilterComponent],
})
export class FilterModule {}
