<script setup lang="ts">
const color = defineModel<string>({ required: true });

const props = defineProps<{
  id: string
  label: string
  title?: string
}>();

const emit = defineEmits<{
  input: []
}>();

const inputTitle = computed(() => props.title ?? props.label);
</script>

<template>
  <div class="mb-3">
    <label :for="props.id" class="form-label">{{ props.label }}</label>
    <div class="input-group">
      <input
        :id="props.id"
        v-model="color"
        type="color"
        class="form-control form-control-color"
        :title="inputTitle"
        style="max-width: 5rem"
        @input="emit('input')"
      />
      <input
        :id="`${props.id}_hex`"
        v-model.trim="color"
        type="text"
        class="form-control font-monospace text-uppercase"
        :title="inputTitle"
        pattern="^#[0-9a-fA-F]{6}$"
        maxlength="7"
        required
        @input="emit('input')"
      />
    </div>
  </div>
</template>
