<script setup lang="ts">
import CategoriesPage from '../categories.vue';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Categorias',
});
</script>

<template>
  <CategoriesPage />
</template>
