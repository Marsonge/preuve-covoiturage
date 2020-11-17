import { CampaignStats } from '~/core/entities/campaign/api-format/CampaignStats';
import { RuleInterface } from './RuleInterface';

export interface CampaignInterface {
  _id?: number;
  parent_id?: number;
  ui_status?: any;
  territory_id: number;
  name: string;
  description: string;
  start_date: Date;
  state?: CampaignStats;
  end_date: Date;
  unit: string;
  status: string;
  global_rules: RuleInterface[];
  rules: RuleInterface[][];
}
