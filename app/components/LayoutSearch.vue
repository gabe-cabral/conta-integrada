<script setup lang="ts">
defineProps({
  loggedIn: {
    type: Boolean,
    required: true,
  },
});

const term = ref('');
</script>

<template>
  <form v-if="loggedIn" class="d-flex input-group" role="search" style="max-width: 30rem">
    <input
      v-model="term"
      class="form-control"
      type="search"
      placeholder="Procurar por algo..."
      aria-label="Pesquisar"
    />
    <button v-if="term" class="btn btn-outline-secondary" type="button">
      <i class="bi bi-x-lg" />
    </button>
    <button class="btn btn-outline-secondary" type="submit"><i class="bi bi-search" /></button>
  </form>
</template>
