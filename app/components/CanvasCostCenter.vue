<script setup lang="ts">
import {
  type CostCenter,
  costCenterCreateSchema,
  type CostCenterData,
} from '~~/shared/schemas/costCenters';

import useSystemStore from '~/stores/systemStore';
import { useAppStore } from '~/stores/appStore';

interface CostCenterForm {
  _id: string | null
  name: string
  description: string
  limit: {
    amount: number | null
    currency: string
  } | null
  categoryIds: string[]
  active: boolean
  updatedAt: Date | null
}

const emits = defineEmits<{
  close: []
  saved: [costCenter: CostCenterData]
}>();

const props = withDefaults(
  defineProps<{
    costCenter?: CostCenter | null
    id?: string | null
  }>(),
  {
    costCenter: null,
    id: null,
  },
);

const { t } = useI18n();
const appStore = useAppStore();
const systemStore = useSystemStore();
const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };

const sending = ref(false);
const validated = ref(false);
const costCenterForm = ref<CostCenterForm | null>(null);

const submitLabel = computed(() =>
  props.id === 'new' ? t('costCenters.form.create') : t('costCenters.form.save'));
const hasLimit = computed({
  get: () => Boolean(costCenterForm.value?.limit),
  set: (enabled: boolean) => {
    if (!costCenterForm.value) return;
    costCenterForm.value.limit = enabled
      ? {
          amount: null,
          currency: systemStore.defaultCurrency,
        }
      : null;
  },
});
const availableCategories = computed(() =>
  appStore.categories.filter((category) => category.active));
const currencyOptions = computed(() => {
  const currencies = appStore.currencies.map((currency) => currency.code);
  return [...new Set([systemStore.defaultCurrency, ...currencies])];
});

function closePanel() {
  costCenterForm.value = null;
  emits('close');
}

function createNew() {
  costCenterForm.value = {
    _id: null,
    name: '',
    description: '',
    limit: null,
    categoryIds: [],
    active: true,
    updatedAt: null,
  };
}

function loadFromProp(source: CostCenter) {
  costCenterForm.value = {
    _id: source._id,
    name: source.name,
    description: source.description ?? '',
    limit: source.limit
      ? {
          amount: source.limit.amountInCents / 100,
          currency: source.limit.currency,
        }
      : null,
    categoryIds: [...source.categoryIds],
    active: source.active,
    updatedAt: source.updatedAt,
  };
}

function syncCostCenter() {
  validated.value = false;

  if (!props.id) {
    costCenterForm.value = null;
  } else if (props.id === 'new') {
    createNew();
  } else {
    costCenterForm.value = null;
    if (props.costCenter) loadFromProp(props.costCenter);
  }
}

async function submit() {
  validated.value = true;
  if (!costCenterForm.value) return;

  const parsed = costCenterCreateSchema.safeParse({
    name: costCenterForm.value.name,
    description: costCenterForm.value.description || undefined,
    limit: costCenterForm.value.limit
      ? {
          amountInCents: Math.round((costCenterForm.value.limit.amount ?? Number.NaN) * 100),
          currency: costCenterForm.value.limit.currency,
          period: 'monthly',
        }
      : undefined,
    categoryIds: costCenterForm.value.categoryIds,
    active: costCenterForm.value.active,
  });

  if (!parsed.success) {
    systemStore.addMessage(
      t('costCenters.form.invalidMessage'),
      t('costCenters.form.invalidTitle'),
      'warning',
      'bi-exclamation-triangle',
      4,
    );
    return;
  }

  sending.value = true;

  try {
    const isCreating = props.id === 'new';
    const endpoint = isCreating ? '/cost-centers' : `/cost-centers/${props.id}`;
    const body = isCreating
      ? parsed.data
      : {
          ...parsed.data,
          description: costCenterForm.value.description.trim(),
          limit: costCenterForm.value.limit ? parsed.data.limit : null,
        };
    const saved = await $userApi<CostCenterData>(endpoint, {
      method: isCreating ? 'POST' : 'PATCH',
      body,
    });

    emits('saved', saved);
    systemStore.addMessage(
      isCreating
        ? t('costCenters.form.createdMessage')
        : t('costCenters.form.updatedMessage'),
      t('costCenters.pageTitle'),
      'success',
      'bi-check-circle',
      3,
    );
    closePanel();
  } finally {
    sending.value = false;
  }
}

watch(() => [props.costCenter, props.id] as const, syncCostCenter, { immediate: true });
</script>

<template>
  <BaseCanvas
    :id="props.id"
    kind="cost_center"
    :title="t('costCenters.form.title')"
    :create-title="t('costCenters.form.createTitle')"
    :sending="sending"
    :validated="validated"
    :submit-label="submitLabel"
    @close="closePanel"
    @submit="submit"
  >
    <template v-if="costCenterForm">
      <p v-if="costCenterForm.updatedAt">
        <small class="text-muted fst-italic">
          {{ t('costCenters.form.lastUpdated', {
            relativeTime: relativeTimeHelper(costCenterForm.updatedAt),
          }) }}
        </small>
      </p>

      <div class="mb-3">
        <label for="cost_center_name" class="form-label">
          {{ t('costCenters.form.name') }}
        </label>
        <input
          id="cost_center_name"
          v-model="costCenterForm.name"
          type="text"
          class="form-control"
          required
          maxlength="50"
          autocomplete="off"
          :placeholder="t('costCenters.form.namePlaceholder')"
        />
        <div class="invalid-feedback">{{ t('costCenters.form.nameRequired') }}</div>
      </div>

      <div class="mb-3">
        <label for="cost_center_description" class="form-label">
          {{ t('costCenters.form.description') }}
        </label>
        <textarea
          id="cost_center_description"
          v-model="costCenterForm.description"
          class="form-control"
          rows="3"
          :placeholder="t('costCenters.form.descriptionPlaceholder')"
        />
      </div>

      <fieldset class="mb-4">
        <legend class="form-label">{{ t('costCenters.form.limit') }}</legend>
        <div class="form-check form-switch mb-3">
          <input
            id="cost_center_has_limit"
            v-model="hasLimit"
            type="checkbox"
            class="form-check-input"
          />
          <label for="cost_center_has_limit" class="form-check-label">
            {{ t('costCenters.form.setLimit') }}
          </label>
        </div>

        <div v-if="costCenterForm.limit" class="input-group">
          <select
            v-model="costCenterForm.limit.currency"
            class="form-select cost-center-currency"
            :aria-label="t('costCenters.form.currency')"
          >
            <option v-for="currency in currencyOptions" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
          <input
            v-model="costCenterForm.limit.amount"
            type="number"
            class="form-control"
            min="0"
            step="0.01"
            required
            :aria-label="t('costCenters.form.limitAmount')"
          />
          <span class="input-group-text">{{ t('costCenters.monthly') }}</span>
        </div>
      </fieldset>

      <fieldset class="mb-4">
        <legend class="form-label">{{ t('costCenters.form.categories') }}</legend>
        <div class="form-text mb-2">{{ t('costCenters.form.categoriesDescription') }}</div>
        <CategorySelectionList
          v-model="costCenterForm.categoryIds"
          :categories="availableCategories"
          :empty-label="t('costCenters.form.noCategories')"
        />
      </fieldset>

      <div class="form-check form-switch mb-3">
        <input
          id="cost_center_active"
          v-model="costCenterForm.active"
          type="checkbox"
          class="form-check-input"
        />
        <label for="cost_center_active" class="form-check-label">
          {{ t('costCenters.form.active') }}
        </label>
      </div>
    </template>

    <p v-else class="text-muted mb-0">{{ t('costCenters.notFound') }}</p>
  </BaseCanvas>
</template>

<style scoped>
.cost-center-currency {
  max-width: 7rem;
}
</style>
