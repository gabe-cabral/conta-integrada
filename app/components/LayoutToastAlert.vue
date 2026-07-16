<script setup lang="ts">
import useSystemStore from '@/stores/systemStore';

const store = useSystemStore();
</script>

<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" aria-live="polite" aria-atomic="true">
    <div v-for="toast in store.toasts" :key="toast.id" class="toast show"
         :class="{ [`text-bg-${toast.type}`]: toast.type }" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <i v-if="toast.icon" class="bi me-1" :class="toast.icon" data-testid="toast-icon" />
        <strong class="me-auto" data-testid="toast-title">{{ toast.title }}</strong>
        <button type="button" class="btn-close" aria-label="Descartar mensagem"
                @click="store.removeMessage(toast.id)" />
      </div>
      <div class="toast-body">{{ toast.message }}</div>
    </div>
  </div>
</template>
