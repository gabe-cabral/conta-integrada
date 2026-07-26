<script setup lang="ts">
import CostCentersPage from '../cost-centers.vue';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Centros de custos',
});
</script>

<template>
  <CostCentersPage />
</template>
