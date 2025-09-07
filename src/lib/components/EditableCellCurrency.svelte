<script lang="ts">
	import EditableCell from './EditableCell.svelte';
	import { formatCurrency, parseCurrency, validateCurrency } from '$lib/helpers/currency';

	export let value: number; // cents
	export let rowId: number | string;
	export let field: string;
	export let table: string;
	export let highlight: boolean = false;
	export let autostart: boolean = false;
</script>

<EditableCell {value} {rowId} {field} {table} {highlight} {autostart} formatter={formatCurrency} parser={parseCurrency} validator={validateCurrency} on:update classDisplay="text-right" />
