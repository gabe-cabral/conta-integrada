<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    currencies: string[]
    title?: string
  }>(),
  {
    title: undefined,
  },
);

const currencyCodes = computed(() => [...new Set(
  props.currencies
    .map((currency) => currency.trim().toUpperCase())
    .filter(Boolean),
)]);
</script>

<template>
  <span
    v-if="currencyCodes.length"
    class="font-monospace small text-body-secondary"
    :title="props.title"
  >
    {{ currencyCodes.join(' · ') }}
  </span>
</template>
