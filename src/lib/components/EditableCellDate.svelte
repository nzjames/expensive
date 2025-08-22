<!-- EditableCellDate.svelte -->
<script lang="ts">
	import EditableCell from './EditableCell.svelte';

	export let value: string; // stored format: 'YYYY-MM-DD'
	export let rowId: number | string;
	export let field: string;
	export let table: string;

	const formatDate = (isoDate: string) => {
		if (!isoDate) return '';
		const [y, m, d] = isoDate.split('-').map(Number);
		if (!y || !m || !d) return '';
		return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
	};

	const parseDate = (input: string) => {
		if (!input) return '';
		// Try DD/MM/YYYY
		let parts = input.split('/');
		if (parts.length === 3) {
			const [d, m, y] = parts.map(Number);
			if (isValidDate(y, m, d)) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		}
		// Try YYYY-MM-DD
		parts = input.split('-');
		if (parts.length === 3) {
			const [y, m, d] = parts.map(Number);
			if (isValidDate(y, m, d)) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		}
		return ''; // invalid input
	};

	const isValidDate = (y: number, m: number, d: number) => {
		const date = new Date(y, m - 1, d);
		return (
			date.getFullYear() === y &&
			date.getMonth() === m - 1 &&
			date.getDate() === d
		);
	};

	const validateDate = (isoDate: string) => {
		if (!isoDate) return false;
		const [y, m, d] = isoDate.split('-').map(Number);
		return isValidDate(y, m, d);
	};
</script>

<EditableCell
	{value}
	{rowId}
	{field}
	{table}
    inputType="date"
	formatter={formatDate}
	parser={parseDate}
	validator={validateDate}
	on:update
/>
