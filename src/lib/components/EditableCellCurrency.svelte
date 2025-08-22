<script lang="ts">
	import EditableCell from './EditableCell.svelte';
	import {formatCurrency, parseCurrency, validateCurrency } from '$lib/helpers/currency';

	export let value: number; // cents
	export let rowId: number | string;
	export let field: string;
	export let table: string;

</script>

<EditableCell
	{value}
	{rowId}
	{field}
	{table}
	formatter={formatCurrency}
	parser={parseCurrency}
	validator={validateCurrency}
	on:update
	classDisplay='text-right'
/>