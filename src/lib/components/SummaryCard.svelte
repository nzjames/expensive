<script lang="ts" use:useRunes>
	import { FrequencyUnit, HistoryStatus } from '../data';
	import { formatCurrency } from '../helpers/currency';
	import pluralize from 'pluralize';

	export let heading: string = 'heading';
	export let total: number = 0;
	export let totalMonth: number = 0;
	export let data = [];
export let showFrequency: boolean;
export let showFrequencyForOne: boolean = false;

	function frequencyLabel(interval: number, unit: string) {
		const base = String(unit || '').toLowerCase();
		return `every ${interval} ${pluralize(base, interval)}`;
	}
</script>

<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
    <div class="grid grid-cols-[1fr_auto] grid-rows-[auto_1fr_auto] h-full gap-2 text-sm items-baseline">
	<h2 class="text-lg font-semibold  row-start-1">{heading}</h2>
	<div class="text-2xl font-bold text-gray-800 text-right row-start-1">
		{formatCurrency(total)}
	</div>
    <div class="grid col-span-2 row-start-2 grid-cols-subgrid auto-rows-auto gap-2">
		{#each data as row (row.id ?? `${row.seriesId}|${row.expenseDate}`)}
			{#if row.status != HistoryStatus.Ignored}
				<div class=" truncate">
					{row.name}
					{#if showFrequency && (showFrequencyForOne || row.frequencyInterval != 1)}
						<span class="text-xs text-gray-500">{frequencyLabel(row.frequencyInterval, row.frequencyUnit)}</span>
                    {/if}
				</div>
				<div class="text-right font-medium">{formatCurrency(row.amountCents)}</div>
			{/if}
		{/each}
    </div>

		<span class="text-sm font-normal text-gray-400 row-start-3">per month</span>
		<span class="text-sm font-normal text-gray-400 text-right row-start-3">{formatCurrency(totalMonth)}</span>
	</div>
</div>
