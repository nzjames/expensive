<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { tick, onMount } from 'svelte';
    import type { SeriesUpdatableColumn, HistoryUpdatableColumn } from '$lib/validation';

    export let value: string | number;
    export let rowId: number | string;
    export let field: SeriesUpdatableColumn | HistoryUpdatableColumn | string;
    export let table: 'expenseSeries' | 'expenseHistory' | string;
	export let options: (string | { label: string; value: string | number })[] = [];
	export let classTd: string = '';
	export let highlight: boolean = false;
	export let autostart: boolean = false;

    type UpdateEvent =
        | { table: 'expenseSeries'; id: number | string; column: SeriesUpdatableColumn | string; value: unknown }
        | { table: 'expenseHistory'; id: number | string; column: HistoryUpdatableColumn | string; value: unknown };
    const dispatch = createEventDispatcher<{ update: UpdateEvent }>();

	let editing = false;
	let selectedValue: string | number = value;
	let selectRef: HTMLSelectElement;

	const pillBase = 'inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium ring-1 ring-inset';
	function pillClassFor(field: string, v: any): string | null {
		if (field !== 'status') return null;
		const val = String(v ?? '').toLowerCase();
		// History statuses
		if (val === 'pending') return `${pillBase} text-amber-800 bg-amber-50 ring-amber-200`;
		if (val === 'verified') return `${pillBase} text-emerald-800 bg-emerald-50 ring-emerald-200`;
		if (val === 'ignored') return `${pillBase} text-slate-700 bg-slate-100 ring-slate-300`;
		// Series statuses
		if (val === 'active') return `${pillBase} text-emerald-800 bg-emerald-50 ring-emerald-200`;
		if (val === 'paused') return `${pillBase} text-amber-800 bg-amber-50 ring-amber-200`;
		if (val === 'canceled') return `${pillBase} text-slate-700 bg-slate-100 ring-slate-300`;
		return `${pillBase} text-slate-800 bg-slate-50 ring-slate-200`;
	}

	async function startEdit() {
		editing = true;
		selectedValue = value;
		await tick();
		selectRef?.focus();
	}

	function cancel() {
		editing = false;
		selectedValue = value;
	}

    function submit() {
        if (selectedValue !== value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dispatch('update', { table: table as any, id: rowId, column: field as any, value: selectedValue });
        }
        editing = false;
    }

	onMount(() => {
		if (autostart) startEdit();
	});
</script>

<td
	class={`cursor-pointer border border-gray-300 py-0 text-sm text-gray-800 ${editing ? 'active' : highlight ? 'active' : 'truncate'} ${classTd} ${editing ? 'relative' : ''}`}
	on:click={!editing ? startEdit : undefined}
	tabindex="0"
	on:keydown={(e) => !editing && e.key === 'Enter' && startEdit()}
	role="gridcell"
	aria-label="Editable cell"
>
	{#if editing}
		<select
			bind:this={selectRef}
			class="absolute inset-x-0 top-0 bottom-0 w-full border border-blue-500 bg-transparent px-4 py-0 text-left text-sm outline-none"
			bind:value={selectedValue}
			on:change={submit}
			on:blur={cancel}
		>
			{#each options as option}
				{#if typeof option === 'string'}
					<option value={option}>{option}</option>
				{:else}
					<option value={option.value}>{option.label}</option>
				{/if}
			{/each}
		</select>
	{:else}
		<span class="inline-block px-4 py-1">
			{#if pillClassFor(field, value)}
				<span class={pillClassFor(field, value)!} role="status" aria-label={String(value)}>{value}</span>
			{:else if typeof value === 'string' || typeof value === 'number'}
				{value}
			{:else}
				{JSON.stringify(value)}
			{/if}
		</span>
	{/if}
</td>
