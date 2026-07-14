<script setup lang="ts">
import FinancialSpacesPage from '../financial-spaces.vue';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Espaços',
});
</script>

<template>
  <FinancialSpacesPage />
</template>
