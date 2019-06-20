const moment = require('moment');

export default function isWeekday({ tripStakeholder, weekday }) {
  const tripStakeholderStartWeekday = moment(tripStakeholder.start).weekday();
  const tripStakeholderEndWeekday = moment(tripStakeholder.end).weekday();

  return weekday.indexOf(tripStakeholderStartWeekday) >= 0
    || weekday.indexOf(tripStakeholderEndWeekday) >= 0;
};