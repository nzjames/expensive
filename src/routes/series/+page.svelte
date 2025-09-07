<script lang="ts" use:useRunes>
	import { onMount } from 'svelte';
	import EditableCell from '$lib/components/EditableCell.svelte';
	import EditableCellCurrency from '$lib/components/EditableCellCurrency.svelte';
	import EditableSelect from '$lib/components/EditableSelect.svelte';
	import EditableCellDate from '$lib/components/EditableCellDate.svelte';
	import NewSeriesRow from '$lib/components/NewSeriesRow.svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';
	import { formatCurrency } from '$lib/helpers/currency';
	import { SeriesStatus, FrequencyUnit } from '$lib/data';
	import { filterYear, filterQuarter, filterMonth, filterWeek } from '$lib/helpers/filters';

	let data = [];
	let focusRowId: number | null = null;
	let focusField: string | null = null;
	let totals = {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};

	// Set your table name here (must match your schema keys in update endpoint)
	const tableName = 'expenseSeries';

	onMount(async () => {
		const res = await fetch('/api/series'); // your read endpoint
		data = await res.json();
		totals = calcTotal(data, totals);
	});

	async function handleUpdate(event) {
		const { table, id, column, value } = event.detail;

		// Optimistic UI update
		const index = data.findIndex((d) => d.id === id);
		if (index !== -1) {
			data[index] = { ...data[index], [column]: value };
		}

		try {
			const res = await fetch('/api/update', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ table, id, column, value })
			});
			if (!res.ok) throw new Error('Failed to update');
		} catch (error) {
			console.error(error);
			// Optionally revert the change or show an error
		}
	}

	function onNewRow(e: CustomEvent<any>) {
		const row = e.detail;
		if (row?.__temp) {
			// Optimistic insert with temporary id at the bottom
			data = [...data, row];
			return;
		}
		if (row?.__replaceTempId != null) {
			const idx = data.findIndex((r) => r.id === row.__replaceTempId);
			if (idx !== -1) {
				data[idx] = row;
			} else {
				data = [...data, row];
			}
			// After save, focus last edited field on real row
			focusRowId = row.id ?? null;
			focusField = row.__lastEditedField ?? null;
			return;
		}
		data = [...data, row];
	}

	$: activeData = data.filter((r) => r.status === SeriesStatus.Active);

	function calcTotal(data, totals) {
		data.forEach((row) => {
			if (row.frequencyUnit == FrequencyUnit.Year && row.status == SeriesStatus.Active) {
				totals.year += row.amountCents / row.frequencyInterval;
			}
			if (row.frequencyUnit == FrequencyUnit.Month && row.frequencyInterval == 3 && row.status == SeriesStatus.Active) {
				totals.quarter += row.amountCents;
			}
			if (row.frequencyUnit == FrequencyUnit.Month && row.frequencyInterval != 3 && row.status == SeriesStatus.Active) {
				totals.month += row.amountCents / row.frequencyInterval;
			}
			if (row.frequencyUnit == FrequencyUnit.Week && row.status == SeriesStatus.Active) {
				totals.week += row.amountCents / row.frequencyInterval;
			}
		});
		return totals;
	}
</script>

<h1 class="px-4 pb-4 text-lg font-semibold">Master expense record</h1>

<div class="grid grid-cols-1 gap-6 px-4 pb-4 md:grid-cols-2 lg:grid-cols-4">
	<SummaryCard heading="Yearly" total={totals.year} totalMonth={totals.year / 12} data={filterYear(activeData)} />
	<SummaryCard heading="Quarterly" total={totals.quarter} totalMonth={totals.quarter / 3} data={filterQuarter(activeData)} />
	<SummaryCard heading="Monthly" total={totals.month} totalMonth={totals.month} data={filterMonth(activeData)} showFrequency showFrequencyForOne />
	<SummaryCard heading="Weekly" total={totals.week} totalMonth={(totals.week * 52) / 12} data={filterWeek(activeData)} showFrequency showFrequencyForOne />
</div>
<section class="pb-4">
	{#if data.length === 0}
		<p>No expense templates found.</p>
	{:else}
		<table class="min-w-full table-fixed border-collapse border border-gray-300">
			<colgroup>
				<col class="w-64" />
				<col class="w-48" />
				<col class="w-40" />
				<col class="w-28" />
				<col class="w-20" />
				<col class="w-24" />
				<col class="w-32" />
				<col class="w-24" />
				<col class="w-32" />
				<col class="w-32" />
				<col class="w-32" />
			</colgroup>
			<thead>
				<tr class="bg-gray-100">
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Name</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Provider</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Type</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Status</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-right text-sm font-semibold text-gray-700">Frequency Interval</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Frequency Unit</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Payment Method</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-right text-sm font-semibold text-gray-700">Amount</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Next Date</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Renewal Date</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Verified Date</td>
				</tr>
			</thead>
			<tbody>
				{#each data as row (row.id)}
					<tr class={`${row.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'} has-[td.active]:bg-yellow-100`}>
						<EditableCell table={tableName} value={row.name} rowId={row.id} field="name" on:update={handleUpdate} autostart={row.id === focusRowId && focusField === 'name'} />
						<EditableCell table={tableName} value={row.provider} rowId={row.id} field="provider" on:update={handleUpdate} autostart={row.id === focusRowId && focusField === 'provider'} />
						<EditableCell table={tableName} value={row.type} rowId={row.id} field="type" on:update={handleUpdate} autostart={row.id === focusRowId && focusField === 'type'} />
						<EditableSelect
							table={tableName}
							value={row.status}
							rowId={row.id}
							field="status"
							options={['active', 'canceled', 'paused']}
							on:update={handleUpdate}
							autostart={row.id === focusRowId && focusField === 'status'}
						/>
						<EditableCell
							table={tableName}
							value={row.frequencyInterval}
							rowId={row.id}
							field="frequencyInterval"
							on:update={handleUpdate}
							classDisplay="text-right"
							autostart={row.id === focusRowId && focusField === 'frequencyInterval'}
						/>
						<EditableSelect
							table={tableName}
							value={row.frequencyUnit}
							rowId={row.id}
							field="frequencyUnit"
							options={['week', 'month', 'year']}
							on:update={handleUpdate}
							autostart={row.id === focusRowId && focusField === 'frequencyUnit'}
						/>
						<EditableSelect
							table={tableName}
							value={row.paymentMethod}
							rowId={row.id}
							field="paymentMethod"
							options={['direct debit', 'online payment', 'CC 1481', 'Manual', 'Cash', 'auto payment']}
							on:update={handleUpdate}
							autostart={row.id === focusRowId && focusField === 'paymentMethod'}
						/>
						<EditableCellCurrency
							table={tableName}
							value={row.amountCents}
							rowId={row.id}
							field="amountCents"
							on:update={handleUpdate}
							autostart={row.id === focusRowId && focusField === 'amountCents'}
						/>
						<EditableCellDate table={tableName} value={row.nextDate} rowId={row.id} field="nextDate" on:update={handleUpdate} autostart={row.id === focusRowId && focusField === 'nextDate'} />
						<EditableCellDate table={tableName} value={row.renewalDate} rowId={row.id} field="renewalDate" on:update={handleUpdate} autostart={row.id === focusRowId && focusField === 'renewalDate'} />
						<EditableCellDate
							table={tableName}
							value={row.verifiedDate}
							rowId={row.id}
							field="verifiedDate"
							on:update={handleUpdate}
							autostart={row.id === focusRowId && focusField === 'verifiedDate'}
						/>
					</tr>
				{/each}
				<NewSeriesRow on:newRow={onNewRow} />
			</tbody>
		</table>
	{/if}
</section>
