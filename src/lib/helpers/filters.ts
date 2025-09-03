import { HistoryStatus, FrequencyUnit } from '../data';
import { ymdTodayUTC, cutoff30Days, cutoffPast30Days } from './date';

type Row = { expenseDate: string; status?: string, frequencyUnit: FrequencyUnit, frequencyInterval: number };

const isVerified = (s?: string) => s === HistoryStatus.Verified;

export const filterUpcoming = (data: Row[], today = ymdTodayUTC()) => data.filter((r) => r.expenseDate > today);
export const filterNext30 = (data: Row[], today = ymdTodayUTC()) => data.filter((r) => r.expenseDate > today && r.expenseDate <= cutoff30Days() && !isVerified(r.status));
export const filterFuture = (data: Row[]) => data.filter((r) => r.expenseDate > cutoff30Days() && r.status !== HistoryStatus.Verified);
export const filterPast = (data: Row[]) => data.filter((r) => r.expenseDate > cutoffPast30Days() && r.status !== HistoryStatus.Verified);
export const filterHistory = (data: Row[], today = ymdTodayUTC()) => data.filter((r) => r.expenseDate <= today || (r.expenseDate > today && isVerified(r.status)));
export const filterOverdue = (data: Row[], today = ymdTodayUTC()) => data.filter((r) =>  (r.expenseDate <= today && r.status === HistoryStatus.Pending));

export const filterYear = (data: Row[]) => data.filter(r => r.frequencyUnit == FrequencyUnit.Year);
export const filterQuarter = (data: Row[]) => data.filter(r => r.frequencyUnit == FrequencyUnit.Month && r.frequencyInterval == 3);
export const filterMonth = (data: Row[]) => data.filter(r => r.frequencyUnit == FrequencyUnit.Month && r.frequencyInterval != 3);
export const filterWeek = (data: Row[]) => data.filter(r => r.frequencyUnit == FrequencyUnit.Week);

export const filterStatusIgnored = (data: Row[]) => data.filter((r) => (r.status !== HistoryStatus.Ignored)); 
