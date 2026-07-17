<script setup lang="ts">
const loading = ref(true);
const cards = ref<Card[]>([]);

async function fetchCards() {
  try {
    const result = await $fetch<object[]>('/api/cards');

    cards.value = result.map(
      (d: object) =>
        ({
          brand: d.institution_id,
          invoiceDate: new Date(`${d.current_invoice_date}T00:00:00`),
          number: d.id.toString().substring(0, 4),
          current: {
            amountInCents: Math.abs(d.current_invoice_value_in_cents),
            currency: d.institution_id === 'visa' ? 'COP' : 'BRL',
            percentage:
              Math.abs(d.current_invoice_value_in_cents) /
              (d.amount_available * 100 + Math.abs(d.current_invoice_value_in_cents)),
          },
        }) as Card,
    );
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchCards();
});
</script>

<template>
  <SectionHeader title="Cartões" />

  <div v-if="loading" class="spinner-border" role="status">
    <span class="visually-hidden">Carregando...</span>
  </div>

  <template v-else>
    <div class="d-flex align-items-stretch gap-3 overflow-x-auto pb-2">
      <CardWidget
        v-for="card in cards"
        :key="card.number"
        :card="card"
        class="bg-white shadow-sm"
      />
    </div>
  </template>
</template>
