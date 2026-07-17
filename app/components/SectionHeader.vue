<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <h5 class="mt-5 mb-3 text-uppercase font-monospace text-muted">{{ props.title }}</h5>
</template>
