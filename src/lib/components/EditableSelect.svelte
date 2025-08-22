<script lang="ts" use:useRunes>
  import { createEventDispatcher } from 'svelte';
  import { tick } from 'svelte';

  export let value: string | number;
  export let rowId: number | string;
  export let field: string;
  export let table: string;
  export let options: (string | { label: string; value: string | number })[] = [];

  const dispatch = createEventDispatcher();

  let editing = false;
  let selectedValue: string | number = value;
  let selectRef: HTMLSelectElement;

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
      dispatch('update', { table, id: rowId, column: field, value: selectedValue });
    }
    editing = false;
  }
</script>

<td
  class={`cursor-pointer border border-gray-300 py-1 text-sm text-gray-800 relative ${editing ? 'active': 'truncate'}`}
  on:click={!editing ? startEdit : undefined}
  tabindex="0"
  on:keydown={(e) => !editing && e.key === 'Enter' && startEdit()}
  role="gridcell"
  aria-label="Editable cell"
>
  {#if editing}
    <select
      bind:this={selectRef}
      class="w-full border bg-transparent border-blue-500 py-0 px-4 text-left text-sm absolute top-0 bottom-0"
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
  <span class="inline-block px-4">
    {#if typeof value === 'string' || typeof value === 'number'}
      {value}
    {:else}
      {JSON.stringify(value)}
    {/if}
  </span>
  {/if}
</td>
