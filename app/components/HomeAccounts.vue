<script setup lang="ts">
const loading = ref(true);
const accounts = ref<BankAccount[]>([]);

async function fetchAccounts() {
  try {
    const result = await $fetch<object[]>('/api/accounts');

    accounts.value = result.map((d: object) => ({
      title: d.name,
      number: d.id.toString(),
      brand: d.institution_id,
      current: {
        amountInCents: d.balance,
        currency: d.institution_id === 'bancolombia' ? 'COP' : 'BRL',
      },
      income: {
        amountInCents: 0,
        currency: d.institution_id === 'bancolombia' ? 'COP' : 'BRL',
      },
      expenses: {
        amountInCents: 0,
        currency: d.institution_id === 'bancolombia' ? 'COP' : 'BRL',
      },
    } as BankAccount));
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchAccounts();
});
</script>

<template>
  <SectionHeader title="Contas" />

  <div v-if="loading" class="spinner-border" role="status">
    <span class="visually-hidden">Carregando...</span>
  </div>

  <template v-else>
    <div class="d-flex align-items-stretch gap-3 pb-2 overflow-x-scroll">
      <AccountWidget v-for="account in accounts" :key="account.number" :account="account"
                     class="bg-white shadow-sm" />
    </div>
  </template>
</template>
