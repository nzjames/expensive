<script lang="ts" use:useRunes>
  import { tick } from 'svelte';
  import EditableCell from '$lib/components/EditableCell.svelte';
  import EditableCellCurrency from '$lib/components/EditableCellCurrency.svelte';
  import EditableSelect from '$lib/components/EditableSelect.svelte';
  import EditableCellDate from '$lib/components/EditableCellDate.svelte';
  import { SeriesStatus, FrequencyUnit } from '$lib/data';
  import { ymdTodayUTC } from '../helpers/date';

  // Parent passes tableName and gets new row via event
  export let tableName: string = 'expenseSeries';

  let isEditing = false;
  let rowId: number | null = null;

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
    nextDate: ymdTodayUTC()
  };

  async function ensureCreated() {
    if (rowId) return;
    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft)
    });
    if (!res.ok) return;
    const created = await res.json();
    rowId = created.id;
    // tell parent to prepend this row into its data array
    const ev = new CustomEvent('newRow', { detail: created });
    dispatchEvent(ev);
    await tick();
  }

  async function start() {
    isEditing = true;
    await ensureCreated();
  }

  async function cancel() {
    if (rowId) {
      await fetch(`/api/series?id=${rowId}`, { method: 'DELETE' });
    }
    isEditing = false;
    rowId = null;
  }
</script>

<tr class="opacity-70 hover:opacity-100">
  {#if !isEditing}
    <td colspan="999"
        class="italic text-neutral-500 cursor-text py-2"
        tabindex="0"
        on:click={start}
        on:keydown={(e) => e.key === 'Enter' && start()}>
      + Add a new series
    </td>
  {:else}
    <!-- Reuse the same editors your table uses -->
    <td><EditableCell table={tableName} rowId={rowId} field="name" value={''} /></td>
    <td><EditableCell table={tableName} rowId={rowId} field="provider" value={''} /></td>
    <td><EditableCell table={tableName} rowId={rowId} field="type" value={''} /></td>
    <td class="text-right"><EditableCellCurrency table={tableName} rowId={rowId} field="amountCents" value={0} /></td>
    <td><EditableCell table={tableName} rowId={rowId} field="paymentMethod" value={''} /></td>
    <td class="w-20"><EditableCell table={tableName} rowId={rowId} field="frequencyInterval" value={1} /></td>
    <td class="w-28">
      <EditableSelect table={tableName} rowId={rowId} field="frequencyUnit"
        value={FrequencyUnit.Month}
        options={[FrequencyUnit.Week, FrequencyUnit.Month, FrequencyUnit.Year]} />
    </td>
    <td class="w-32"><EditableCellDate table={tableName} rowId={rowId} field="nextDate" value={draft.nextDate} /></td>
    <td class="w-28">
      <EditableSelect table={tableName} rowId={rowId} field="status"
        value={SeriesStatus.Active}
        options={[SeriesStatus.Active, SeriesStatus.Paused, SeriesStatus.Canceled]} />
    </td>
    <td class="text-right">
      <button class="px-2 py-1 border rounded" on:click={cancel}>Cancel</button>
    </td>
  {/if}
</tr>
