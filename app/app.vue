<script setup lang="ts">
import { useFinanceStore } from './stores/financeStore';

const appStore = useAppStore();
const financeStore = useFinanceStore();

await financeStore.fetchBalances();

appStore.setCurrencyList([
  { code: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
  { code: 'COP', label: 'Peso Colombiano', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'Dólar Americano', symbol: 'US$' },
]);
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <HeaderMenu />
      <NuxtPage />
      <LayoutToastAlert />
    </NuxtLayout>
  </div>
</template>
