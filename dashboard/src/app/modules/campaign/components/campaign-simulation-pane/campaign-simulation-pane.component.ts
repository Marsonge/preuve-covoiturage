import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CampaignReducedStats } from '~/core/entities/campaign/api-format/CampaignStats';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CampaignUx } from '~/core/entities/campaign/ux-format/campaign-ux';
import * as moment from 'moment';
import { CampaignApiService } from '../../services/campaign-api.service';
import { CampaignFormater } from '~/core/entities/campaign/api-format/campaign.formater';
import { DestroyObservable } from '~/core/components/destroy-observable';
import { takeUntil } from 'rxjs/operators';
import { AuthenticationService } from '~/core/services/authentication/authentication.service';
import { IncentiveUnitEnum } from '~/core/enums/campaign/incentive-unit.enum';
import { CurrencyPipe } from '@angular/common';

interface SimulationDateRange {
  startDate: Date;
  endDate: Date;
  startDateString: string;
  endDateString: string;
  nbMonth: number;
}

function getTimeState(nbMonth): SimulationDateRange {
  const d = new Date();

  // take last month if the day number is up to 5
  // else take the month before
  const monthOffset = d.getDate() > 5 ? 0 : -1;

  // end last day of define of month before
  const endDate = new Date(d.getFullYear(), d.getMonth() + monthOffset, 0);
  // start first day of month before based on defined months count (1 > 3 months)

  const startDate = new Date(d.getFullYear(), d.getMonth() - nbMonth + monthOffset, 1);

  return {
    nbMonth,
    startDate,
    endDate,
    startDateString: format(startDate, 'd MMMM yyyy', { locale: fr }),
    endDateString: format(endDate, 'd MMMM yyyy', { locale: fr }),
  };
}

@Component({
  selector: 'app-campaign-simulation-pane',
  templateUrl: './campaign-simulation-pane.component.html',
  styleUrls: ['./campaign-simulation-pane.component.scss'],
})
export class CampaignSimulationPaneComponent extends DestroyObservable implements OnInit, OnChanges {
  state: CampaignReducedStats = { trip_excluded: 0, trip_subsidized: 0, amount: 0 };
  @Input() campaign: CampaignUx;

  nbMonth = 1;
  timeState = getTimeState(1);
  simulatedCampaign: CampaignUx;

  constructor(protected campaignApi: CampaignApiService, protected auth: AuthenticationService) {
    super();
  }

  updateCampaign() {
    this.timeState = getTimeState(this.nbMonth);
    this.simulatedCampaign.start = moment(this.timeState.startDate);
    this.simulatedCampaign.end = moment(this.timeState.endDate);
    delete this.simulatedCampaign._id;
    delete this.simulatedCampaign.state;
    // if (!this.simulatedCampaign._id) {
    if (this.auth.user && (this.simulatedCampaign.territory_id || this.auth.user.territory_id)) {
      const simCampaignApi = CampaignFormater.toApi(this.simulatedCampaign);

      if (!simCampaignApi.territory_id) {
        simCampaignApi.territory_id = this.auth.user.territory_id;
      }
      // console.log('simulate campaign', this.simulatedCampaign, simCampaignApi);
      this.campaignApi
        .simulate(simCampaignApi)
        .pipe(takeUntil(this.destroy$))
        .subscribe((state) => {
          this.state = {
            ...state,
            // amount: new CurrencyPipe('FR').transform(state.amount, 'EUR', 'symbol', '1.0-0') as any,
            amount:
              this.simulatedCampaign.unit === IncentiveUnitEnum.EUR
                ? (new CurrencyPipe('FR').transform(state.amount / 100, 'EUR', 'symbol', '1.2-2') as any)
                : (`${state.amount} pt${state.amount > 1 ? 's' : ''}` as any),
          };
        });
    } else {
      console.warn(
        // eslint-disable-next-line max-len
        'campaign sim panel : User has to be connected and territory_id has to provider from user context or campaign',
      );
    }
    // }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.campaign) {
      this.simulatedCampaign = new CampaignUx(changes.campaign.currentValue);

      this.updateCampaign();
    }
  }

  ngOnInit(): void {
    if (this.campaign) {
      this.simulatedCampaign = new CampaignUx(this.campaign);
      this.updateCampaign();
    }
  }
}
