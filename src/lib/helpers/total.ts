import { HistoryStatus, FrequencyUnit } from '../data';
export function calcTotal(data) {
	let totals = {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};
	data.forEach((row) => {
		if (row.status === HistoryStatus.Ignored) return;

		// Yearly: sum per-year cost (handle multi-year intervals)
		if (row.frequencyUnit === FrequencyUnit.Year) {
			totals.year += row.amountCents / row.frequencyInterval;
			return;
		}

		// Monthly/Quarterly: 3-month interval goes to quarter (per-quarter total), others to monthly (per-month average)
		if (row.frequencyUnit === FrequencyUnit.Month) {
			if (row.frequencyInterval === 3) {
				totals.quarter += row.amountCents; // per quarter
			} else {
				totals.month += row.amountCents / row.frequencyInterval; // per month average
			}
			return;
		}

		// Weekly: per-week average for multi-week intervals
		if (row.frequencyUnit === FrequencyUnit.Week) {
			totals.week += row.amountCents / row.frequencyInterval;
			return;
		}
	});
	return totals;
}
