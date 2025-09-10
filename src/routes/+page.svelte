<script lang="ts">
	import { onMount } from 'svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';
    import EditableCell from '$lib/components/EditableCell.svelte';
    import EditableCellCurrency from '../lib/components/EditableCellCurrency.svelte';
    import EditableCellDate from '../lib/components/EditableCellDate.svelte';
    import EditableSelect from '$lib/components/EditableSelect.svelte';
    import { calcTotal } from '$lib/helpers/total';
    import {formatCurrency } from '$lib/helpers/currency';
    import { HistoryStatus } from '$lib/data';

	import { filterYear, filterQuarter, filterMonth, filterWeek, filterOverdue, filterFuture } from '$lib/helpers/filters';

	let historyData = [];
	let upcomingData = [];
	let overdueData = [];
    let next30Data = [];
    let futureData = [];
	let historySnapshot = [];
	let upcomingTotals = {
		month: 0,
		year: 0,
		quarter: 0,
		week: 0
	};
	const tableName = 'expenseHistory';
    // Column width hints across tables using Tailwind widths; Note column flexes (auto)
    const colClasses = [
        'w-64',  // Name
        'w-48',  // Provider
        'w-40',  // Type
        'w-28',  // Status
        'w-28',  // Freq Interval
        'w-24',  // Freq Unit
        'w-24',  // Payment Method
        'w-24',  // Amount
        'w-32',  // Expense Date
        'w-32',  // Actual Date
        'w-auto' // Note (flex)
    ];

	onMount(async () => {
		const [historyResponse, upcomingResponse] = await Promise.all([
			fetch('/api/history'),
			fetch('/api/upcoming') // combined history+projection for next 30 days
		]);
		historyData = await historyResponse.json();
		upcomingData = await upcomingResponse.json();

		updateData();
	});

	function updateData() {
		// Build a rolling snapshot: latest history row per seriesId
		const bySeries = new Map<number, any>();
		for (const r of historyData) {
			if (r.seriesId == null) continue;
            if (r.status === HistoryStatus.Ignored) continue;
			const cur = bySeries.get(r.seriesId);
			if (!cur || r.expenseDate > cur.expenseDate) bySeries.set(r.seriesId, r);
		}
		historySnapshot = Array.from(bySeries.values()).sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));

		// Use snapshot for summary cards and totals
		upcomingTotals = calcTotal(historySnapshot);

		// Keep next-30-day view using upcoming (history + projections)
		upcomingData = [...upcomingData].sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
		next30Data = upcomingData.filter((r) => r.source !== 'history' || r.status !== HistoryStatus.Verified);

		// Overdue and long-term future based on full history
        const histSorted = [...historyData].sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
        overdueData = filterOverdue(histSorted);
		futureData = filterFuture(histSorted);

	}

const sumRows = (rows) =>{
    let total = 0;
    rows.forEach(r =>  total += r.amountCents);
    return total;
}

	async function handleUpdate(event) {
		const { table, id, column, value } = event.detail;

		// Optimistic UI update
		const index = historyData.findIndex((d) => d.id === id);
		if (index !== -1) {
			historyData[index] = { ...historyData[index], [column]: value };
		}

		// Keep the upcoming (history+projection) cache in sync for edited history rows
		if (table === 'expenseHistory') {
			const uidx = upcomingData.findIndex((d) => d?.source === 'history' && d?.id === id);
			if (uidx !== -1) {
				upcomingData[uidx] = { ...upcomingData[uidx], [column]: value };
			}
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

<div class="px-4 pb-4 text-xl text-right">
{formatCurrency((upcomingTotals.year/12)+(upcomingTotals.quarter/3)+ (upcomingTotals.month) + (upcomingTotals.week*52/12))}
</div>

<div class="grid grid-cols-1 gap-6 px-4 pb-4 md:grid-cols-2 lg:grid-cols-4">
	<SummaryCard heading="Yearly" total={upcomingTotals.year} totalMonth={upcomingTotals.year / 12} data={filterYear(historySnapshot)} />
	<SummaryCard heading="Quarterly" total={upcomingTotals.quarter} totalMonth={upcomingTotals.quarter / 3} data={filterQuarter(historySnapshot)} />
	<SummaryCard heading="Monthly" total={upcomingTotals.month} totalMonth={upcomingTotals.month} data={filterMonth(historySnapshot)} showFrequency/>
	<SummaryCard heading="Weekly" total={upcomingTotals.week} totalMonth={(upcomingTotals.week * 52) / 12} data={filterWeek(historySnapshot)} showFrequency />
</div>


<div>

<section class="pb-4">
	{#if overdueData.length !== 0}
<h1 class="px-4 pb-4 text-lg font-semibold">Overdue</h1>
		<table class={`table-fixed min-w-full border-collapse border border-gray-300`}>
			<colgroup>
				{#each colClasses as c}
					<col class={c} />
				{/each}
			</colgroup>
			<thead>
				<tr class="bg-gray-100">
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Name</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Provider</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Type</td>
					<td class="border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Status</td>
					<td class="border border-gray-300 px-4 py-1  text-right text-sm font-semibold text-gray-700">Frequency Interval</td>
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
					<tr class={`odd:bg-gray-50 even:bg-white has-[td.active]:bg-yellow-100`}>
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

<h1 class="px-4 pb-4 text-lg font-semibold">Upcoming (30 days)</h1>
<section class="pb-4">
	{#if historyData.length === 0}
		<p>No upcoming expenses</p>
	{:else}
		<table class={`table-fixed min-w-full border-collapse border border-gray-300`}>
			<colgroup>
				{#each colClasses as c}
					<col class={c} />
				{/each}
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
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Expense Date</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Actual Date</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Note</td>
				</tr>
			</thead>
			<tbody>
				{#each next30Data as row (row.id ?? `${row.seriesId}|${row.expenseDate}`)}
					<tr class={`odd:bg-gray-50 even:bg-white has-[td.active]:bg-yellow-100`}>
						{#if row.source === 'history'}
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
						{:else}
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">{row.name}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">{row.provider}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">{row.type}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">
								<span class="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium ring-1 ring-inset text-sky-800 bg-sky-50 ring-sky-200" role="status" aria-label="projected">projected</span>
							</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate  text-right">{row.frequencyInterval}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">{row.frequencyUnit}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">{row.paymentMethod}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate  text-right">{formatCurrency(row.amountCents)}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ">{row.expenseDate}</td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate "></td>
							<td class="border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate "></td>
						{/if}
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

<h1 class="px-4 pb-4 text-lg font-semibold">Future</h1>
<section class="pb-4">
	{#if historyData.length === 0}
		<p>No upcoming expenses</p>
	{:else}
		<table class={`table-fixed min-w-full border-collapse border border-gray-300`}>
			<colgroup>
				{#each colClasses as c}
					<col class={c} />
				{/each}
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
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Expense Date</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Actual Date</td>
					<td class="w-1 border border-gray-300 px-4 py-1 text-left text-sm font-semibold text-gray-700">Note</td>
				</tr>
			</thead>
			<tbody>
				{#each futureData as row (row.id)}
					<tr class={`odd:bg-gray-50 even:bg-white has-[td.active]:bg-yellow-100`}>
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

</div>
