<script setup lang="ts">
const props = defineProps({
  money: {
    type: Object as PropType<Money>,
    required: true,
  },
});

const currencyFormatter = computed(
  () =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: props.money.currency,
    }),
);

const amount = computed(() => props.money.amountInCents / 100);
</script>

<template>
  <span class="font-serif">{{ currencyFormatter.format(amount) }}</span>
</template>
