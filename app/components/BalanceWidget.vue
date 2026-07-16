<script setup lang="ts">
const props = defineProps({
  balance: {
    type: Object as PropType<Balance>,
    required: true,
  },
});
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle-fill me-3" />
        <div>
          <h4 class="mb-1"><MoneyDisplay :money="props.balance.currentBalance" /></h4>
          <small class="d-flex justify-content-between align-items-center gap-2 mb-1">
            <span class="d-block text-success">
              &plus; <MoneyDisplay :money="props.balance.income" />
            </span>
            <span class="d-block text-danger">
              &minus; <MoneyDisplay :money="props.balance.expenses" />
            </span>
          </small>
          <div class="text-info" title="Saldo previsto no fim do mês">
            <i class="bi bi-graph-up-arrow me-2" />
            <MoneyDisplay :money="props.balance.projectedBalance" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
