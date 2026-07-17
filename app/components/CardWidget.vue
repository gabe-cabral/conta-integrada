<script setup lang="ts">
const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <LazyNuxtImg
          :src="`/icons/banks/${props.card.brand}.png`"
          width="50"
          :alt="props.card.brand"
          class="text-capitalize rounded-3"
        />
        <h5 class="card-title m-0">{{ props.card.number }}</h5>
      </div>
      <div class="card-text d-flex justify-content-between align-items-center mb-2">
        <h5 class="m-0">
          <MoneyDisplay :money="props.card.current" />
        </h5>
        <small>{{ dateFormatter.format(props.card.invoiceDate) }}</small>
      </div>
      <div
        v-if="props.card.current.percentage >= 0"
        class="progress mb-1 mt-3"
        role="progressbar"
        aria-label="Basic example"
        aria-valuenow="75"
        aria-valuemin="0"
        aria-valuemax="100"
        style="height: 2px"
      >
        <div class="progress-bar" :style="{ width: `${props.card.current.percentage * 100}%` }" />
      </div>
    </div>
  </div>
</template>
<style lang="css" scoped>
.card {
  min-width: 18rem;
}
</style>
