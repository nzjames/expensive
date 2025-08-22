<script lang="ts" use:useRunes>
	import { createEventDispatcher } from 'svelte';
	import { tick, onMount } from 'svelte';

	export let value: string | number;
	export let rowId: number | string;
	export let field: string;
	export let table: string;
	export let classDisplay: string = '';
	export let inputType: string = 'text';

	// Optional hooks
	export let formatter: (v: any) => string | number = (v) => v;
	export let parser: (v: any) => any = (v) => v;
	export let validator: (v: any) => boolean = () => true;

	const dispatch = createEventDispatcher();

	let editing = false;
	let inputValue: string | number;
	let inputRef: HTMLInputElement;

	onMount(() => {
		inputValue = formatter(value);
	});

	async function startEdit() {
		editing = true;
		inputValue = formatter(value);
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
	<td class="cursor-pointer px-0 py-0 text-sm text-gray-800 active relative ">
		<input
			bind:this={inputRef}
			class={`w-full border border-blue-500 px-4 py-0 text-left text-sm bg-transparent absolute top-0 bottom-0 ${classDisplay}`}
			type={inputType}
			bind:value={inputValue}
			on:blur={submit}
			on:keydown={onKeydown}
		/>
	</td>
{:else}
	<td
		class={`cursor-pointer border border-gray-300 px-4 py-1 text-sm text-gray-800 truncate ${classDisplay}`}
		on:click={startEdit}
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && startEdit()}
		role="gridcell"
		aria-label="Editable cell"
	>
		{formatter(value)}
	</td>
{/if}
