<script setup lang="ts">
import TomSelect from 'tom-select';
import type { TomSettings } from 'tom-select/dist/esm/types/settings.js';

interface MultiSelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    options: MultiSelectOption[]
    placeholder?: string
    disabled?: boolean
    multiple?: boolean
  }>(),
  {
    placeholder: 'Selecione as opções',
    disabled: false,
    multiple: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const selectElement = ref<HTMLSelectElement>()
let tomSelect: TomSelect | undefined

onMounted(() => {
  if (!selectElement.value) {
    return
  }

  const settings: TomSettings = {
    plugins: {
      remove_button: {
        title: 'Remover',
      },
    },
    placeholder: props.placeholder,
    create: false,
    persist: false,
    onChange(value) {
      const selectedValues = Array.isArray(value)
        ? value
        : value
          ? [value]
          : []

      emit('update:modelValue', selectedValues)
    },
  }

  tomSelect = new TomSelect(selectElement.value, settings);
});

watch(
  () => props.modelValue,
  (value) => {
    if (!tomSelect) {
      return;
    }

    const currentValue = tomSelect.getValue();
    const currentValues = Array.isArray(currentValue)
      ? currentValue
      : currentValue
        ? [currentValue]
        : [];

    if (JSON.stringify(currentValues) !== JSON.stringify(value)) {
      tomSelect.setValue(value, true);
    }
  },
)

watch(
  () => props.disabled,
  (disabled) => {
    if (!tomSelect) {
      return;
    }

    disabled ? tomSelect.disable() : tomSelect.enable();
  },
)

onBeforeUnmount(() => {
  tomSelect?.destroy();
})
</script>

<template>
  <select ref="selectElement" :multiple="props.multiple" :disabled="disabled" autocomplete="off">
    <option v-for="option in options" :key="option.value" :value="option.value"
            :selected="modelValue.includes(option.value)">
      {{ option.label }}
    </option>
  </select>
</template>

<style>
@import 'tom-select/dist/css/tom-select.bootstrap5.css';
</style>
