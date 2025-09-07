<script lang="ts" use:useRunes>
	import { createEventDispatcher } from 'svelte';
	import { tick, onMount } from 'svelte';

	export let value: string | number;
	export let rowId: number | string;
	export let field: string;
	export let table: string;
	export let classDisplay: string = '';
	export let inputType: string = 'text';
	export let highlight: boolean = false;
	export let autostart: boolean = false;

	// Optional hooks
	export let formatter: (v: any) => string | number = (v) => v;
	export let parser: (v: any) => any = (v) => v;
	export let validator: (v: any) => boolean = () => true;

	const dispatch = createEventDispatcher();

	let editing = false;
	let inputValue: string | number;
	let inputRef: HTMLInputElement;

	onMount(async () => {
		inputValue = inputType === 'date' ? (value as any) : formatter(value);
		if (autostart) {
			await startEdit();
		}
	});

	async function startEdit() {
		editing = true;
		inputValue = inputType === 'date' ? (value as any) : formatter(value);
		await tick();
		inputRef?.focus();
		inputRef?.select();
	}

	function cancel() {
		editing = false;
		inputValue = formatter(value);
	}

	function submit() {
		const parsed = parser(inputValue);
		if (!validator(parsed)) {
			cancel();
			return;
		}

		if (parsed !== value) {
			dispatch('update', { table, id: rowId, column: field, value: parsed });
		}
		editing = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			submit();
		} else if (event.key === 'Escape') {
			cancel();
		}
	}
</script>

{#if editing}
	<td class={`active relative cursor-pointer border border-gray-300 px-0 py-0 text-sm text-gray-800 ${classDisplay}`}>
		<input
			bind:this={inputRef}
			class={`absolute inset-x-0 top-0 bottom-0 w-full border border-blue-500 bg-transparent px-4 py-0 text-left text-sm outline-none ${classDisplay}`}
			type={inputType}
			bind:value={inputValue}
			on:blur={submit}
			on:keydown={onKeydown}
		/>
	</td>
{:else}
	<td
		class={`cursor-pointer truncate border border-gray-300 px-4 py-1 text-sm text-gray-800 ${highlight ? 'active' : ''} ${classDisplay}`}
		on:click={startEdit}
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && startEdit()}
		role="gridcell"
		aria-label="Editable cell"
	>
		{formatter(value)}
	</td>
{/if}
