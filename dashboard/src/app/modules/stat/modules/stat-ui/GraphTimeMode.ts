export enum GraphTimeMode {
  Month = 'month',
  Day = 'day',
  Cumulative = 'cumulative',
}

export const GraphTimeModeLabel: { [key: string]: string } = {
  [GraphTimeMode.Cumulative]: 'Cumulée',
  [GraphTimeMode.Day]: 'par jour',
  [GraphTimeMode.Month]: 'par mois',
};

export const GraphTimeModeNavList: GraphTimeMode[] = [GraphTimeMode.Cumulative, GraphTimeMode.Day, GraphTimeMode.Month];
