<script setup lang="ts">
const props = defineProps({
  account: {
    type: Object as PropType<BankAccount>,
    required: true,
  },
});
</script>

<template>
  <div v-if="props.account" class="card">
    <div class="card-body">
      <div class="d-flex align-items-center mb-3">
        <LazyNuxtImg
          :src="`/icons/banks/${props.account.brand}.png`"
          height="32"
          width="32"
          :alt="props.account.brand"
          class="text-capitalize me-2 rounded-circle"
        />
        <div>
          <small class="text-uppercase text-muted font-monospace">{{ props.account.brand }}</small>
          <p class="card-title mb-0">{{ props.account.number }}</p>
        </div>
      </div>
      <h5><MoneyDisplay :money="props.account.current" /></h5>
      <small class="d-block text-success">
        &plus; <MoneyDisplay :money="props.account.income" />
      </small>
      <small class="d-block text-danger">
        &minus; <MoneyDisplay :money="props.account.expenses" />
      </small>
    </div>
  </div>
</template>

<style lang="css" scoped>
.card {
  min-width: 15rem;
}
</style>
