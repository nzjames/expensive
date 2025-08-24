<script lang="ts" use:useRunes>
	import { onMount } from 'svelte';
	import EditableCell from '$lib/components/EditableCell.svelte';
	import EditableCellCurrency from '$lib/components/EditableCellCurrency.svelte';
	import EditableSelect from '$lib/components/EditableSelect.svelte';
	import EditableCellDate from '$lib/components/EditableCellDate.svelte';
	import { formatCurrency } from '$lib/helpers/currency';
	import { ymdTodayUTC, cutoff30Days } from '../../lib/helpers/date';
	import { HistoryStatus } from '../../lib/data';

	let data = [];
	let upcomingData = [];
	let next30Data = [];
	let futureData = [];
	let historyData = [];

	let upcomingTotals = {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};
	let historyTotals =  {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};
	let today = ymdTodayUTC();

	// Set your table name here (must match your schema keys in update endpoint)
	const tableName = 'expenseHistory';

	onMount(async () => {
		const res = await fetch('/api/history'); // your read endpoint
		data = await res.json();

		updateData();
	});

	function updateData() {
		next30Data = data.filter((r) => r.expenseDate > today && r.expenseDate <= cutoff30Days).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
		futureData = data.filter((r) => r.expenseDate > cutoff30Days).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));

		upcomingData = data.filter(r => r.expenseDate > today);
		upcomingTotals = calcTotal(upcomingData, upcomingTotals);
		historyData = data.filter(r => r.expenseDate <= today).sort((a,b)=> b.expenseDate.localeCompare(a.expenseDate));
		historyTotals = calcTotal(historyData, historyTotals);

	}

	async function handleUpdate(event) {
		const { table, id, column, value } = event.detail;

		// Optimistic UI update
		const index = data.findIndex((d) => d.id === id);
		if (index !== -1) {
			data[index] = { ...data[index], [column]: value };
		}
		updateData();

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

	function calcTotal(data, totals) {
		data.forEach((row) => {
			if (row.frequencyUnit == 'year'  && row.status != HistoryStatus.Ignored  ) {
				totals.year += (row.amountCents / row.frequencyInterval);
			}
			if (row.frequencyUnit == 'month'  && row.frequencyInterval == 3 && row.status != HistoryStatus.Ignored  ) {
				totals.quarter += row.amountCents;
			}
			if (row.frequencyUnit == 'month'  && row.frequencyInterval == 1 && row.status != HistoryStatus.Ignored  ) {
				totals.month += (row.amountCents / row.frequencyInterval);
			}
			if (row.frequencyUnit == 'week'  && row.status != HistoryStatus.Ignored  ) {
				totals.week += (row.amountCents / row.frequencyInterval);
			}
		});
		return totals;
	}
</script>
<div class="grid grid-cols-1 gap-6 pb-8 px-8 md:grid-cols-2 lg:grid-cols-4">
	<!-- Yearly -->
	<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
		<h2 class="mb-3 text-lg font-semibold">Year</h2>
		<div class="mb-4 text-2xl font-bold text-gray-800">{formatCurrency(upcomingTotals.year)}</div>
		<div class="grid grid-cols-5 gap-2 text-sm">
			{#each upcomingData as row (row.id)}
				{#if row.frequencyUnit == 'year' && row.status != HistoryStatus.Ignored }
					<div class="col-span-4 truncate">{row.name}</div>
					<div class="text-right font-medium">{formatCurrency(row.amountCents)}</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Quarterly -->
	<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
		<h2 class="mb-3 text-lg font-semibold">Quarterly</h2>
		<div class="mb-4 text-2xl font-bold text-gray-800">{formatCurrency(upcomingTotals.quarter)}</div>
		<div class="grid grid-cols-2 gap-2 text-sm">
			{#each upcomingData as row (row.id)}
				{#if row.frequencyUnit == 'month' && row.frequencyInterval == 3 && row.status != HistoryStatus.Ignored}
					<div class="truncate">{row.name}</div>
					<div class="text-right font-medium">{formatCurrency(row.amountCents)}</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Monthly -->
	<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
		<h2 class="mb-1 text-lg font-semibold">Monthly</h2>
		<div class="mb-4 text-2xl font-bold text-gray-800">{formatCurrency(upcomingTotals.month)}</div>
		<div class="grid grid-cols-2 gap-2 text-sm">
			{#each upcomingData as row (row.id)}
				{#if row.frequencyUnit == 'month' && row.frequencyInterval == 1 && row.status != HistoryStatus.Ignored }
					<div class="truncate">{row.name}</div>
					<div class="text-right font-medium">{formatCurrency(row.amountCents)}</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Weekly -->
	<div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
		<h2 class="mb-3 text-lg font-semibold">Weekly</h2>
		<div class="mb-4 text-2xl font-bold text-gray-800">{formatCurrency(upcomingTotals.week)}</div>
		<div class="grid grid-cols-2 gap-2 text-sm">
			{#each upcomingData as row (row.id)}
				{#if row.frequencyUnit == 'week' && row.status != HistoryStatus.Ignored }
					<div class="truncate">
						{row.name} <span class="text-xs text-gray-500">every {row.frequencyInterval} weeks</span>
					</div>
					<div class="text-right font-medium">{formatCurrency(row.amountCents)}</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
<h1 class="px-8 pb-8 text-lg font-semibold">Upcoming expenses (30 days)</h1>
<section class="pb-8 ">
{#if data.length === 0}
	<p>No upcoming expenses</p>
{:else}
	<table class="min-w-full border-collapse border border-gray-300">
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
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Expense Date</td>
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Actual Date</td>
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Note</td>
			</tr>
		</thead>
		<tbody>
			{#each next30Data as row (row.id)}
				<tr class={`${row.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'} has-[td.active]:bg-yellow-100`}>
					<EditableCell table={tableName} value={row.name} rowId={row.id} field="name" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.provider} rowId={row.id} field="provider" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.type} rowId={row.id} field="type" on:update={handleUpdate} />
					<EditableSelect table={tableName} value={row.status} rowId={row.id} field="status" options={['pending', 'verified', 'ignored']} on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.frequencyInterval} rowId={row.id} field="frequencyInterval" on:update={handleUpdate} classDisplay="text-right" />
					<EditableSelect table={tableName} value={row.frequencyUnit} rowId={row.id} field="frequencyUnit" options={['week', 'month', 'year']} on:update={handleUpdate} />
					<EditableSelect
						table={tableName}
						value={row.paymentMethod}
						rowId={row.id}
						field="paymentMethod"
						options={['direct debit', 'online payment', 'CC 1481', 'Manual', 'Cash', 'auto payment']}
						on:update={handleUpdate}
					/>
					<EditableCellCurrency table={tableName} value={row.amountCents} rowId={row.id} field="amountCents" on:update={handleUpdate} />
					<EditableCellDate table={tableName} value={row.expenseDate} rowId={row.id} field="expenseDate" on:update={handleUpdate} />
					<EditableCellDate table={tableName} value={row.actualDate} rowId={row.id} field="actualDate" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.note} rowId={row.id} field="note" on:update={handleUpdate} />
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
</section>

<h1 class="px-8 pb-8 text-lg font-semibold">Future</h1>
<section class="pb-8 ">
{#if data.length === 0}
	<p>No upcoming expenses</p>
{:else}
	<table class="min-w-full border-collapse border border-gray-300">
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
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Expense Date</td>
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Actual Date</td>
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Note</td>
			</tr>
		</thead>
		<tbody>
			{#each futureData as row (row.id)}
				<tr class={`${row.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'} has-[td.active]:bg-yellow-100`}>
					<EditableCell table={tableName} value={row.name} rowId={row.id} field="name" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.provider} rowId={row.id} field="provider" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.type} rowId={row.id} field="type" on:update={handleUpdate} />
					<EditableSelect table={tableName} value={row.status} rowId={row.id} field="status" options={['pending', 'verified', 'ignored']} on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.frequencyInterval} rowId={row.id} field="frequencyInterval" on:update={handleUpdate} classDisplay="text-right" />
					<EditableSelect table={tableName} value={row.frequencyUnit} rowId={row.id} field="frequencyUnit" options={['week', 'month', 'year']} on:update={handleUpdate} />
					<EditableSelect
						table={tableName}
						value={row.paymentMethod}
						rowId={row.id}
						field="paymentMethod"
						options={['direct debit', 'online payment', 'CC 1481', 'Manual', 'Cash', 'auto payment']}
						on:update={handleUpdate}
					/>
					<EditableCellCurrency table={tableName} value={row.amountCents} rowId={row.id} field="amountCents" on:update={handleUpdate} />
					<EditableCellDate table={tableName} value={row.expenseDate} rowId={row.id} field="expenseDate" on:update={handleUpdate} />
					<EditableCellDate table={tableName} value={row.actualDate} rowId={row.id} field="actualDate" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.note} rowId={row.id} field="note" on:update={handleUpdate} />
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
</section>

<h1 class="px-8 pb-8 text-lg font-semibold">History</h1>
<section class="pb-8 ">
{#if data.length === 0}
	<p>No upcoming expenses</p>
{:else}
	<table class="min-w-full border-collapse border border-gray-300">
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
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Expense Date</td>
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Actual Date</td>
				<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Note</td>
			</tr>
		</thead>
		<tbody>
			{#each historyData as row (row.id)}
				<tr class={`${row.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'} has-[td.active]:bg-yellow-100`}>
					<EditableCell table={tableName} value={row.name} rowId={row.id} field="name" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.provider} rowId={row.id} field="provider" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.type} rowId={row.id} field="type" on:update={handleUpdate} />
					<EditableSelect table={tableName} value={row.status} rowId={row.id} field="status" options={['pending', 'verified', 'ignored']} on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.frequencyInterval} rowId={row.id} field="frequencyInterval" on:update={handleUpdate} classDisplay="text-right" />
					<EditableSelect table={tableName} value={row.frequencyUnit} rowId={row.id} field="frequencyUnit" options={['week', 'month', 'year']} on:update={handleUpdate} />
					<EditableSelect
						table={tableName}
						value={row.paymentMethod}
						rowId={row.id}
						field="paymentMethod"
						options={['direct debit', 'online payment', 'CC 1481', 'Manual', 'Cash', 'auto payment']}
						on:update={handleUpdate}
					/>
					<EditableCellCurrency table={tableName} value={row.amountCents} rowId={row.id} field="amountCents" on:update={handleUpdate} />
					<EditableCellDate table={tableName} value={row.expenseDate} rowId={row.id} field="expenseDate" on:update={handleUpdate} />
					<EditableCellDate table={tableName} value={row.actualDate} rowId={row.id} field="actualDate" on:update={handleUpdate} />
					<EditableCell table={tableName} value={row.note} rowId={row.id} field="note" on:update={handleUpdate} />
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
</section>

