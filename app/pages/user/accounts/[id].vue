<script setup lang="ts">
import AccountsPage from '../accounts';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Contas',
});
</script>

<template>
  <AccountsPage />
</template>
