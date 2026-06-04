<script setup lang="ts">
import AccountsPage from '../accounts.vue';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Contas',
});
</script>

<template>
  <AccountsPage />
</template>
