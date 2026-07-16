<script setup lang="ts">
import type { Offcanvas } from 'bootstrap';

let offcanvas: Offcanvas | undefined;
const offcanvasElement = ref<HTMLElement | null>(null);

const emits = defineEmits<{
  close: []
  submit: []
}>();

const props = withDefaults(defineProps<{
  id?: string | null
  kind: string
  loading?: boolean
  loadingLabel?: string
  sending?: boolean
  submitLabel?: string
  title: string
  validated?: boolean
}>(), {
  id: null,
  loading: false,
  sending: false,
  validated: false,
  loadingLabel: 'Carregando...',
  submitLabel: '',
});

const panelId = computed(() => `${props.kind}_form`);
const labelId = computed(() => `${props.kind}_form_label`);
const isOpen = computed(() => Boolean(props.id));
const heading = computed(() => props.id === 'new' ? `Novo ${props.title}` : props.title);
const submitText = computed(() => {
  if (props.submitLabel) return props.submitLabel;
  return props.id === 'new' ? `Criar ${props.title}` : 'Salvar alteracoes';
});

function syncPanel() {
  if (!offcanvas) return;

  if (isOpen.value) {
    offcanvas.show();
  } else {
    offcanvas.hide();
  }
}

function requestClose() {
  offcanvas?.hide();
}

function emitClose() {
  emits('close');
}

watch(() => props.id, () => {
  syncPanel();
});

onMounted(async () => {
  const { Offcanvas } = await import('bootstrap');

  if (offcanvasElement.value) {
    offcanvas = new Offcanvas(offcanvasElement.value);
    offcanvasElement.value.addEventListener('hidden.bs.offcanvas', emitClose);
    syncPanel();
  }
});

onUnmounted(() => {
  offcanvasElement.value?.removeEventListener('hidden.bs.offcanvas', emitClose);
  offcanvas?.dispose();
  offcanvas = undefined;
});
</script>

<template>
  <Teleport to="body">
    <div :id="panelId" ref="offcanvasElement" class="offcanvas offcanvas-end ci-offcanvas" tabindex="-1"
         :aria-labelledby="labelId">
      <div class="offcanvas-header">
        <h5 :id="labelId" class="offcanvas-title text-capitalize">
          {{ heading }}
        </h5>
        <button type="button" class="btn-close" aria-label="Fechar" @click="requestClose" />
      </div>
      <div class="offcanvas-body">
        <div v-if="props.loading" class="d-flex align-items-center mt-4">
          <div class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          <strong role="status">{{ props.loadingLabel }}</strong>
        </div>

        <form v-else class="needs-validation" :class="{ 'was-validated': props.validated }"
              novalidate @submit.prevent="emits('submit')">
          <slot v-bind="$attrs" />

          <button type="submit" class="btn btn-primary mt-4" :disabled="props.sending">
            <i class="bi bi-floppy2-fill me-2" />
            {{ submitText }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ci-offcanvas {
  --bs-offcanvas-width: min(100vw, 34rem);
}
</style>
