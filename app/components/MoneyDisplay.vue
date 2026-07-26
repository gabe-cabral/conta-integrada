<script setup lang="ts">
import type { Money } from '~~/shared/types/finances';

const props = defineProps<{
  money: Money
}>();

const { locale } = useI18n();

const currencyFormatter = computed(() =>
  new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: props.money.currency,
    currencyDisplay: 'narrowSymbol',
  }));

const amount = computed(() => props.money.amountInCents / 100);
</script>

<template>
  <span class="font-serif" :title="props.money.currency">
    {{ currencyFormatter.format(amount) }}
  </span>
</template>
