<script setup lang="ts">
import type { Dropdown } from 'bootstrap';
import { useAppStore } from '~/stores/appStore';
import useSystemStore from '~/stores/systemStore';
import generateColorFromText from '~/utils/generateColorFromText';
import {
  FINANCIAL_SPACE_ICON_GROUPS,
  countTextCharacters,
  financialSpaceCreateSchema,
  type FinancialSpace,
  type FinancialSpaceData,
} from '~~/shared/schemas/financialSpaces';

type FinancialSpaceIcon = NonNullable<FinancialSpace['icon']>;

interface FinancialSpaceForm {
  _id: string | null;
  name: string;
  description: string;
  icon: FinancialSpaceIcon;
  color: string;
  categoryMode: FinancialSpace['categoryMode'];
  categoryIds: string[];
  currencies: string[];
  showOnDashboard: boolean;
  updatedAt: Date | null;
}

const emits = defineEmits<{
  close: [];
  saved: [financialSpace: FinancialSpaceData];
}>();

const props = withDefaults(defineProps<{
  id?: string | null;
  financialSpace?: FinancialSpace | null;
}>(), {
  id: null,
  financialSpace: null,
});

const appStore = useAppStore();
const systemStore = useSystemStore();
const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };

const sending = ref(false);
const validated = ref(false);
const financialSpace = ref<FinancialSpaceForm | null>(null);
const iconSearch = ref('');
const iconButton = ref<HTMLButtonElement | null>(null);
const colorManuallyChanged = ref(false);
let iconDropdown: Dropdown | undefined;

const submitLabel = computed(() => props.id === 'new' ? 'Criar espaço' : 'Salvar alterações');
const allCategories = computed({
  get: () => financialSpace.value?.categoryMode === 'all',
  set: (checked: boolean) => {
    if (!financialSpace.value) return;
    financialSpace.value.categoryMode = checked ? 'all' : 'selected';
  },
});

const availableCategories = computed(() => appStore.categories.filter(category => category.active));

const currencyOptions = computed(() => appStore.currencies.map(currency => ({
  value: currency.code,
  label: `${currency.label} (${currency.code})`,
})));

const filteredIcons = computed(() => {
  const query = iconSearch.value.trim().toLocaleLowerCase();

  return FINANCIAL_SPACE_ICON_GROUPS.flatMap(group => group.icons.map(icon => ({
    icon,
    searchIndex: `${group.name} ${icon}`.toLocaleLowerCase(),
  }))).filter(option => !query || option.searchIndex.includes(query));
});

function closePanel() {
  financialSpace.value = null;
  emits('close');
}

function createNew() {
  const icon: FinancialSpaceIcon = 'house-fill';
  const name = '';

  colorManuallyChanged.value = false;
  financialSpace.value = {
    _id: null,
    name,
    description: '',
    icon,
    color: generateColorFromText(name || 'Espaço', icon),
    categoryMode: 'all',
    categoryIds: [],
    currencies: appStore.currencies.map(currency => currency.code),
    showOnDashboard: true,
    updatedAt: null,
  };
}

function loadFromProp(source: FinancialSpace) {
  colorManuallyChanged.value = true;
  financialSpace.value = {
    _id: source._id,
    name: source.name,
    description: source.description ?? '',
    icon: source.icon ?? 'house-fill',
    color: source.color ?? generateColorFromText(source.name, source.icon ?? 'house-fill'),
    categoryMode: source.categoryMode,
    categoryIds: [...source.categoryIds],
    currencies: [...(source.currencies ?? appStore.currencies.map(currency => currency.code))],
    showOnDashboard: source.showOnDashboard,
    updatedAt: source.updatedAt,
  };
}

function syncFinancialSpace() {
  validated.value = false;
  iconSearch.value = '';

  if (!props.id) {
    financialSpace.value = null;
    return;
  }

  if (props.id === 'new') {
    createNew();
    return;
  }

  financialSpace.value = null;
  if (props.financialSpace) loadFromProp(props.financialSpace);
}

function selectIcon(icon: FinancialSpaceIcon) {
  if (!financialSpace.value) return;

  financialSpace.value.icon = icon;
  iconDropdown?.hide();
}

function markColorAsManual() {
  colorManuallyChanged.value = true;
}

async function submit() {
  validated.value = true;
  if (!financialSpace.value) return;

  const parsed = financialSpaceCreateSchema.safeParse({
    name: financialSpace.value.name,
    description: financialSpace.value.description,
    icon: financialSpace.value.icon,
    color: financialSpace.value.color,
    categoryMode: financialSpace.value.categoryMode,
    categoryIds: financialSpace.value.categoryMode === 'all' ? [] : financialSpace.value.categoryIds,
    currencies: financialSpace.value.currencies.length > 0 ? financialSpace.value.currencies : undefined,
    showOnDashboard: financialSpace.value.showOnDashboard,
  });

  if (!parsed.success) {
    systemStore.addMessage(
      'Revise os campos do espaço antes de salvar.',
      'Formulário inválido',
      'warning',
      'bi-exclamation-triangle',
      4,
    );
    return;
  }

  sending.value = true;

  try {
    const isCreating = props.id === 'new';
    const endpoint = isCreating ? '/financial-spaces' : `/financial-spaces/${props.id}`;
    const saved = await $userApi<FinancialSpaceData>(endpoint, {
      method: isCreating ? 'POST' : 'PATCH',
      body: parsed.data,
    });

    emits('saved', saved);
    systemStore.addMessage(
      isCreating ? 'Espaço criado com sucesso.' : 'Espaço atualizado com sucesso.',
      'Espaços',
      'success',
      'bi-check-circle',
      3,
    );
    closePanel();
  } finally {
    sending.value = false;
  }
}

watch(
  () => [props.id, props.financialSpace] as const,
  syncFinancialSpace,
  { immediate: true },
);

watch(
  () => [financialSpace.value?.name, financialSpace.value?.icon] as const,
  ([name, icon]) => {
    if (!financialSpace.value || colorManuallyChanged.value || !icon) return;
    financialSpace.value.color = generateColorFromText(name || 'Espaço', icon);
  },
);

watch(
  () => appStore.currencies.map(currency => currency.code),
  (currencies) => {
    if (props.id === 'new' && financialSpace.value && financialSpace.value.currencies.length === 0) {
      financialSpace.value.currencies = [...currencies];
    }
  },
);

onMounted(async () => {
  const { Dropdown } = await import('bootstrap');
  if (iconButton.value) iconDropdown = Dropdown.getOrCreateInstance(iconButton.value);
});

onUnmounted(() => iconDropdown?.dispose());
</script>

<template>
  <BaseCanvas :id="props.id" kind="financial_space" title="espaço" :sending="sending"
              :validated="validated" :submit-label="submitLabel" @close="closePanel" @submit="submit">
    <template v-if="financialSpace">
      <p v-if="financialSpace.updatedAt">
        <small class="text-muted fst-italic">
          Alterado pela última vez {{ relativeTimeHelper(financialSpace.updatedAt) }}
        </small>
      </p>

      <div class="mb-3">
        <label for="financial_space_name" class="form-label">Nome do espaço</label>
        <input id="financial_space_name" v-model="financialSpace.name" type="text" class="form-control"
               list="financial_space_name_suggestions" required minlength="2" maxlength="20"
               autocomplete="off" placeholder="Ex.: Casa">
        <datalist id="financial_space_name_suggestions">
          <option value="Casa" />
          <option value="Pessoal" />
          <option value="Empresa" />
          <option value="Viagens" />
          <option value="Família" />
        </datalist>
        <div class="form-text">Use de 2 a 20 caracteres. Emojis também são aceitos.</div>
      </div>

      <div class="mb-3">
        <label for="financial_space_description" class="form-label">Descrição</label>
        <textarea id="financial_space_description" v-model="financialSpace.description" class="form-control"
                  maxlength="150" rows="3" placeholder="Descreva o contexto financeiro deste espaço" />
        <div class="form-text text-end">{{ countTextCharacters(financialSpace.description) }}/150</div>
      </div>

      <div class="mb-3">
        <label class="form-label">Ícone</label>
        <div class="dropdown">
          <button ref="iconButton" class="btn btn-outline-secondary dropdown-toggle w-100 text-start" type="button"
                  data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
            <i :class="`bi bi-${financialSpace.icon} me-2`" /> {{ financialSpace.icon }}
          </button>
          <div class="dropdown-menu financial-space-icon-menu p-2">
            <input v-model="iconSearch" type="search" class="form-control mb-2" placeholder="Pesquisar ícones"
                   aria-label="Pesquisar ícones" @click.stop @keydown.stop>
            <div class="financial-space-icon-grid">
              <button v-for="option in filteredIcons" :key="option.icon" type="button"
                      class="btn btn-outline-secondary" :class="{ active: financialSpace.icon === option.icon }"
                      :title="option.icon" :aria-label="`Selecionar ícone ${option.icon}`"
                      @click.stop="selectIcon(option.icon)">
                <i :class="`bi bi-${option.icon}`" />
              </button>
            </div>
            <p v-if="filteredIcons.length === 0" class="text-muted small mb-0 py-2 text-center">
              Nenhum ícone encontrado.
            </p>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label for="financial_space_color" class="form-label">Cor</label>
        <div class="input-group">
          <input id="financial_space_color" v-model="financialSpace.color" type="color"
                 class="form-control form-control-color" title="Escolher cor do espaço" @input="markColorAsManual">
          <span class="input-group-text font-monospace">{{ financialSpace.color.toUpperCase() }}</span>
        </div>
      </div>

      <div class="mb-3 form-check">
        <input id="financial_space_all_categories" v-model="allCategories" type="checkbox" class="form-check-input">
        <label for="financial_space_all_categories" class="form-check-label">
          Todas as categorias estão disponíveis nesse espaço
        </label>
      </div>

      <div v-if="!allCategories" class="mb-3">
        <label class="form-label">Categorias disponíveis</label>
        <CategorySelectionList v-model="financialSpace.categoryIds" :categories="availableCategories"
                               empty-label="Nenhuma categoria ativa disponível." />
        <div class="form-text">Selecione as categorias e subcategorias que poderão ser usadas neste espaço.</div>
      </div>

      <div class="mb-3">
        <label for="financial_space_currencies" class="form-label">Moedas utilizadas</label>
        <MultiSelectField id="financial_space_currencies" v-model="financialSpace.currencies"
                          :options="currencyOptions" class="form-select" :multiple="true"
                          placeholder="Selecione as moedas disponíveis no espaço"
                          aria-label="Moedas disponíveis no espaço" />
      </div>

      <div class="mb-3 form-check">
        <input id="financial_space_dashboard" v-model="financialSpace.showOnDashboard" type="checkbox"
               class="form-check-input">
        <label for="financial_space_dashboard" class="form-check-label">Exibir na página inicial</label>
      </div>
    </template>

    <p v-else class="text-muted mb-0">Espaço não encontrado.</p>
  </BaseCanvas>
</template>

<style scoped>
.financial-space-icon-menu {
  width: min(22rem, calc(100vw - 2rem));
}

.financial-space-icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: .4rem;
  max-height: 15rem;
  overflow-y: auto;
}

.financial-space-icon-grid .btn {
  aspect-ratio: 1;
  padding: .25rem;
}
</style>
