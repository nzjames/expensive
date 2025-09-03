<script lang="ts" use:useRunes>
	import { onMount } from 'svelte';
	import EditableCell from '$lib/components/EditableCell.svelte';
	import EditableCellCurrency from '$lib/components/EditableCellCurrency.svelte';
	import EditableSelect from '$lib/components/EditableSelect.svelte';
	import EditableCellDate from '$lib/components/EditableCellDate.svelte';
	import { ymdTodayUTC } from '../../lib/helpers/date';
	import { calcTotal } from '../../lib/helpers/total';
	import { filterUpcoming, filterHistory, filterNext30, filterFuture } from '../../lib/helpers/filters';

	let data = [];
	let historyData = [];

	let historyTotals = {
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
		historyData = filterHistory(data).sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));

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



<h1 class="px-8 pb-8 text-lg font-semibold">History</h1>
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

