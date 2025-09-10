<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import EditableCell from '$lib/components/EditableCell.svelte';
	import EditableCellCurrency from '$lib/components/EditableCellCurrency.svelte';
	import EditableSelect from '$lib/components/EditableSelect.svelte';
	import EditableCellDate from '$lib/components/EditableCellDate.svelte';
	import { SeriesStatus, FrequencyUnit } from '$lib/data';
	import { ymdTodayUTC } from '../helpers/date';

	// Parent passes tableName and gets new row via event
	export let tableName: string = 'expenseSeries';

	let isEditing = false;
	const dispatch = createEventDispatcher();

	// Defaults must satisfy NOT NULL
	let draft = {
		name: '',
		provider: '',
		type: '',
		paymentMethod: '',
		amountCents: 0,
		frequencyInterval: 1,
		frequencyUnit: FrequencyUnit.Month,
		status: SeriesStatus.Active,
		nextDate: ymdTodayUTC(),
		renewalDate: '',
		verifiedDate: ''
	};

	let lastEditedField: string = 'name';

	async function start() {
		isEditing = true;
	}

	async function cancel() {
		isEditing = false;
		// reset draft
		draft = {
			name: '',
			provider: '',
			type: '',
			paymentMethod: '',
			amountCents: 0,
			frequencyInterval: 1,
			frequencyUnit: FrequencyUnit.Month,
			status: SeriesStatus.Active,
			nextDate: ymdTodayUTC(),
			renewalDate: '',
			verifiedDate: ''
		};
	}

	async function addNow() {
		// Optimistic insert
		const tempId = -Math.floor(Math.random() * 1_000_000);
		const optimistic = { id: tempId, ...draft, createdAt: new Date().toISOString() } as any;
		dispatch('newRow', { ...optimistic, __temp: true });

		try {
			const res = await fetch('/api/series', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(draft)
			});
			if (!res.ok) throw new Error('create failed');
			const created = await res.json();
			// Replace temporary row in parent
			dispatch('newRow', { ...created, __replaceTempId: tempId, __lastEditedField: lastEditedField });
		} catch (e) {
			// TODO: surface error UI; for now, no-op
			console.error('Create failed', e);
		} finally {
			// reset state
			cancel();
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			addNow();
		}
	}
</script>

<tr class="opacity-70 hover:opacity-100" on:keydown={onKeyDown}>
	{#if !isEditing}
		<td colspan="999" class="cursor-text py-2 text-neutral-500 italic" tabindex="0" on:click={start} on:keydown={(e) => e.key === 'Enter' && start()}> + Add a new series </td>
	{:else}
		<!-- Match table column order exactly; do not wrap components in <td> -->
		<EditableCell
			table={tableName}
			rowId={''}
			field="name"
			value={draft.name}
			autostart={true}
			on:update={(e) => {
				draft.name = e.detail.value;
				lastEditedField = 'name';
			}}
		/>
		<EditableCell
			table={tableName}
			rowId={''}
			field="provider"
			value={draft.provider}
			on:update={(e) => {
				draft.provider = e.detail.value;
				lastEditedField = 'provider';
			}}
		/>
		<EditableCell
			table={tableName}
			rowId={''}
			field="type"
			value={draft.type}
			on:update={(e) => {
				draft.type = e.detail.value;
				lastEditedField = 'type';
			}}
		/>
		<EditableSelect
			table={tableName}
			rowId={''}
			field="status"
			value={draft.status}
			options={[SeriesStatus.Active, SeriesStatus.Canceled, SeriesStatus.Paused]}
			classTd="w-28"
			on:update={(e) => {
				draft.status = e.detail.value;
				lastEditedField = 'status';
			}}
		/>
		<EditableCell
			table={tableName}
			rowId={''}
			field="frequencyInterval"
			value={draft.frequencyInterval}
			classDisplay="text-right w-20"
			on:update={(e) => {
				draft.frequencyInterval = e.detail.value;
				lastEditedField = 'frequencyInterval';
			}}
		/>
		<EditableSelect
			table={tableName}
			rowId={''}
			field="frequencyUnit"
			value={draft.frequencyUnit}
			options={[FrequencyUnit.Week, FrequencyUnit.Month, FrequencyUnit.Year]}
			classTd="w-28"
			on:update={(e) => {
				draft.frequencyUnit = e.detail.value;
				lastEditedField = 'frequencyUnit';
			}}
		/>
		<EditableSelect
			table={tableName}
			rowId={''}
			field="paymentMethod"
			value={draft.paymentMethod}
			options={['direct debit', 'online payment', 'CC 1481', 'Manual', 'Cash', 'auto payment']}
			on:update={(e) => {
				draft.paymentMethod = e.detail.value;
				lastEditedField = 'paymentMethod';
			}}
		/>
		<EditableCellCurrency
			table={tableName}
			rowId={''}
			field="amountCents"
			value={draft.amountCents}
			on:update={(e) => {
				draft.amountCents = e.detail.value;
				lastEditedField = 'amountCents';
			}}
		/>
		<EditableCellDate
			table={tableName}
			rowId={''}
			field="nextDate"
			value={draft.nextDate}
			on:update={(e) => {
				draft.nextDate = e.detail.value;
				lastEditedField = 'nextDate';
			}}
		/>
		<EditableCellDate
			table={tableName}
			rowId={''}
			field="renewalDate"
			value={draft.renewalDate}
			on:update={(e) => {
				draft.renewalDate = e.detail.value;
				lastEditedField = 'renewalDate';
			}}
		/>
		<EditableCellDate
			table={tableName}
			rowId={''}
			field="verifiedDate"
			value={draft.verifiedDate}
			on:update={(e) => {
				draft.verifiedDate = e.detail.value;
				lastEditedField = 'verifiedDate';
			}}
		/>
	{/if}
</tr>

{#if isEditing}
	<tr>
		<td colspan="11" class="px-4 py-2 text-right">
			<button class="mr-2 rounded border px-3 py-1 text-sm" on:click={cancel}>Cancel</button>
			<button class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700" on:click={addNow}>
				Add <span class="ml-1 opacity-70">(Cmd/Ctrl + Enter)</span>
			</button>
		</td>
	</tr>
{/if}
