<script lang="ts" use:useRunes>
	import { onMount } from 'svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';
    import EditableCell from '$lib/components/EditableCell.svelte';
    import EditableCellCurrency from '../lib/components/EditableCellCurrency.svelte';
    import EditableCellDate from '../lib/components/EditableCellDate.svelte';
    import EditableSelect from '$lib/components/EditableSelect.svelte';
    import { calcTotal } from '$lib/helpers/total';
    import {formatCurrency } from '$lib/helpers/currency';

	import { filterUpcoming, filterYear, filterQuarter, filterMonth, filterWeek, filterOverdue, filterNext30, filterFuture } from '$lib/helpers/filters';

	let data = [];
	let upcomingData = [];
	let overdueData = [];
    let next30Data = [];
    let futureData = [];
	let upcomingTotals = {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};
	const tableName = 'expenseHistory';

	onMount(async () => {
		const res = await fetch('/api/history'); // your read endpoint
		data = await res.json();

		updateData();
	});

	function updateData() {
		upcomingData = filterUpcoming(data).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
		upcomingTotals = calcTotal(upcomingData);

        overdueData = filterOverdue(data).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
        next30Data = filterNext30(data).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
        
		futureData = filterFuture(data).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));

	}

const sumRows = (rows) =>{
    let total = 0;
    rows.forEach(r =>  total += r.amountCents);
    return total;
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



</script>

<div class="grid grid-cols-1 gap-6 px-8 pb-8 md:grid-cols-2 lg:grid-cols-4">
	<SummaryCard heading="Yearly" total={upcomingTotals.year} totalMonth={upcomingTotals.year / 12} data={filterYear(upcomingData)} />
	<SummaryCard heading="Quarterly" total={upcomingTotals.quarter} totalMonth={upcomingTotals.quarter / 3} data={filterQuarter(upcomingData)} />
	<SummaryCard heading="Monthly" total={upcomingTotals.month} totalMonth={upcomingTotals.month} data={filterMonth(upcomingData)} showFrequency/>
	<SummaryCard heading="Weekly" total={upcomingTotals.week} totalMonth={(upcomingTotals.week * 52) / 12} data={filterWeek(upcomingData)} showFrequency />
</div>


<section class="pb-8">
	{#if overdueData.length !== 0}
<h1 class="px-8 pb-8 text-lg font-semibold">Overdue</h1>
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
				{#each overdueData as row (row.id)}
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

<h1 class="px-8 pb-8 text-lg font-semibold">Upcoming (30 days)</h1>
<section class="pb-8">
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
                <tr>
                    <td colspan="7"></td>
                    <td class="border border-gray-300 px-4 py-1 text-left text-right text-sm font-semibold text-gray-700"> {formatCurrency(sumRows(next30Data))}</td>
                    <td colspan="3"></td>
                </tr>


			</tbody>
		</table>
	{/if}
</section>

<h1 class="px-8 pb-8 text-lg font-semibold">Future</h1>
<section class="pb-8">
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
