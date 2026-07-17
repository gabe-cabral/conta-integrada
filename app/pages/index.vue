<script setup lang="ts">
import type { Money } from '#shared/types/finances';

import { useFinanceStore } from '~/stores/financeStore';

definePageMeta({
  middleware: ['authenticated'],
});

const { user } = useUserSession();
const financeStore = useFinanceStore();

const essentialExpenses = computed(() =>
  financeStore.balances.filter((balance) => balance.essentialExpenses?.amountInCents),
).value.map((balance) => balance.essentialExpenses as Money);

const otherExpenses = computed(() =>
  financeStore.balances.filter((balance) => balance.otherExpenses?.amountInCents),
).value.map((balance) => balance.otherExpenses as Money);

const investments = computed(() =>
  financeStore.balances.filter((balance) => balance.investments?.amountInCents),
).value.map((balance) => balance.investments as Money);

const analyticalData = ref([
  { id: 'essential-expenses', label: 'Gastos essenciais', pct: 0.26, data: essentialExpenses },
  { id: 'investments', label: 'Investimentos', pct: 0.4, data: investments },
  { id: 'other-expenses', label: 'Gastos outros', pct: 0.3, data: otherExpenses },
]);
</script>

<template>
  <LayoutPage>
    <div class="d-flex justify-content-between align-items-center">
      <h5 class="card-title text-alternative">
        Boa tarde <b>{{ user?.name }}</b>
      </h5>
      <PeriodPicker />
    </div>

    <SectionHeader title="Saldos" />
    <div class="row row-cols-1 row-cols-md-4 g-3">
      <div v-for="balance in financeStore.balances" :key="balance.currency" class="col">
        <BalanceWidget :balance="balance" class="bg-white shadow-sm" />
      </div>
    </div>

    <SectionHeader title="Analítico" />
    <div class="row row-cols-1 row-cols-md-3 g-3">
      <div v-for="data in analyticalData" :key="data.id" class="col">
        <div class="card h-100 bg-white shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-stretch justify-content-between gap-2 mb-2">
              <h6 class="m-0">{{ data.label }}</h6>
              <small>{{ data.pct * 100 }}%</small>
            </div>
            <div class="d-flex align-items-top justify-content-between gap-2">
              <div v-if="data.id === 'investments'">
                <i class="bi bi-graph-up-arrow me-1" /><br />R$ +5,00<br />
                +3,09%
              </div>
              <small class="d-flex gap-1 flex-column">
                <span v-for="expense in data.data" :key="expense?.currency">
                  <MoneyDisplay :money="expense" />
                </span>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <HomeCards />
    <HomeAccounts />

    <SectionHeader title="Orçamentos" />
    <div class="d-flex align-items-stretch gap-3">
      <div class="card bg-danger-subtle">
        <div class="card-body text-center">
          <h5 class="m-0">
            <i class="bi bi-exclamation-triangle-fill" />
          </h5>
          <small style="font-size: 70%">108%</small>
        </div>
      </div>
    </div>
  </LayoutPage>
</template>

<style lang="scss" module>
.card {
  background-color: white;
}
</style>
