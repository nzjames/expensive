import { HistoryStatus, FrequencyUnit } from '../data';
export function calcTotal(data) {
	let totals = {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};
	data.forEach((row) => {
		if (row.frequencyUnit == FrequencyUnit.Year && row.status != HistoryStatus.Ignored) {
			totals.year += row.amountCents / row.frequencyInterval;
		}
		if (row.frequencyUnit == FrequencyUnit.Month && row.frequencyInterval == 3 && row.status != HistoryStatus.Ignored) {
			totals.quarter += row.amountCents;
		}
		if (row.frequencyUnit == FrequencyUnit.Month && row.frequencyInterval == 1 && row.status != HistoryStatus.Ignored) {
			totals.month += row.amountCents / row.frequencyInterval;
		}
		if (row.frequencyUnit == FrequencyUnit.Week && row.status != HistoryStatus.Ignored) {
			totals.week += row.amountCents / row.frequencyInterval;
		}
	});
	return totals;
}
