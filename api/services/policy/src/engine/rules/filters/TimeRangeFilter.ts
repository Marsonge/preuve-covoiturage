import { utcToZonedTime } from '../../helpers/utcToZonedTime';
import { RuleHandlerContextInterface } from '../../interfaces';
import { NotApplicableTargetException } from '../../exceptions/NotApplicableTargetException';
import { FilterRule } from '../FilterRule';

interface Range {
  start: number;
  end: number;
  tz?: string;
}

export class TimeRangeFilter extends FilterRule<Range[]> {
  static readonly slug: string = 'time_range_filter';
  static readonly description: string = 'Filtre par horaire';
  static readonly schema: { [k: string]: any } = {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['start', 'end'],
      properties: {
        start: {
          type: 'integer',
          minimum: 0,
          maximum: 23,
        },
        end: {
          type: 'integer',
          minimum: 0,
          maximum: 23,
        },
        tz: {
          macro: 'tz',
        },
      },
    },
  };
  filter(ctx: RuleHandlerContextInterface): void {
    for (const range of this.parameters) {
      const hours = utcToZonedTime(ctx.person.datetime, range.tz).getHours();
      if (hours >= range.start && hours <= range.end) {
        return;
      }
    }
    throw new NotApplicableTargetException(TimeRangeFilter.description);
  }
}
