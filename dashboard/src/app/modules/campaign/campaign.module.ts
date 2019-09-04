import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NouisliderModule } from 'ng2-nouislider';

import { CampaignRoutingModule } from '~/modules/campaign/campaign-routing.module';
import { MaterialModule } from '~/shared/modules/material/material.module';
import { SharedModule } from '~/shared/shared.module';
import { UiTripModule } from '~/modules/trip/modules/ui-trip/ui-trip.module';
import { StatUIModule } from '~/modules/stat/modules/stat-ui/stat-ui.module';

import { CampaignDashboardComponent } from './pages/campaign-dashboard/campaign-dashboard.component';
import { CampaignMenuComponent } from './components/campaign-menu/campaign-menu.component';
import { CampaignsListComponent } from './modules/campaign-ui/components/campaigns-list/campaigns-list.component';
import { CampaignCreateEditComponent } from './pages/campaign-create-edit/campaign-create-edit.component';
import { CampaignFormComponent } from './components/campaign-form/campaign-form.component';
import { CampaignTemplatesComponent } from './components/campaign-form/campaign-templates/campaign-templates.component';
import { RulesFormComponent } from './components/campaign-form/rules-form/rules-form.component';
import { ParametersFormComponent } from './components/campaign-form/parameters-form/parameters-form.component';
import { SummaryFormComponent } from './components/campaign-form/summary-form/summary-form.component';
import { RestrictionFormComponent } from './components/campaign-form/restriction-form/restriction-form.component';
import { RetributionFormComponent } from './components/campaign-form/retribution-form/retribution-form.component';
import { StaggeredFormComponent } from './components/campaign-form/staggered-form/staggered-form.component';
import { CampaignDiscoverComponent } from './pages/campaign-discover/campaign-discover.component';
import { CampaignCardComponent } from './components/campaign-card/campaign-card.component';
import { CampaignMapComponent } from './components/campaign-map/campaign-map.component';
import { FormulaFormComponent } from './components/campaign-form/formula-form/formula-form.component';
import { FormulaGuideComponent } from './components/campaign-form/formula-guide/formula-guide.component';

@NgModule({
  declarations: [
    CampaignDashboardComponent,
    CampaignMenuComponent,
    CampaignsListComponent,
    CampaignCreateEditComponent,
    CampaignFormComponent,
    CampaignTemplatesComponent,
    RulesFormComponent,
    ParametersFormComponent,
    SummaryFormComponent,
    RestrictionFormComponent,
    RetributionFormComponent,
    StaggeredFormComponent,
    CampaignDiscoverComponent,
    CampaignCardComponent,
    CampaignMapComponent,
    FormulaFormComponent,
    FormulaGuideComponent,
  ],
  imports: [
    CampaignRoutingModule,
    CommonModule,
    MaterialModule,
    SharedModule,
    UiTripModule,
    StatUIModule,
    FormsModule,
    ReactiveFormsModule,
    NouisliderModule,
  ],
  providers: [CurrencyPipe, DecimalPipe],
  exports: [CampaignsListComponent],
})
export class CampaignModule {}
