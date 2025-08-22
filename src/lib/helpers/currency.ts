export const formatCurrency = (cents: number) => {
	return (cents / 100).toFixed(2);
};
export const parseCurrency = (str: string) => {
	const n = parseFloat(str);
	return isNaN(n) ? 0 : Math.round(n * 100);
};
export const validateCurrency = (cents: number) => Number.isInteger(cents);
