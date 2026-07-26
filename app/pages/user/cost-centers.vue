<script setup lang="ts">
import {
  type CostCenter,
  type CostCenterData,
  costCenterSchema,
} from '~~/shared/schemas/costCenters';

import useSystemStore from '~/stores/systemStore';
import { useAppStore } from '~/stores/appStore';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Centros de custos',
});

const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const systemStore = useSystemStore();

const loading = ref(true);
const costCenters = ref<CostCenter[]>([]);
const selectedCostCenter = ref<string | null>(getRouteCostCenterId());

const basePath = '/user/cost-centers';
const sections = computed(() => [
  {
    key: 'active',
    title: t('costCenters.activeSection'),
    costCenters: costCenters.value.filter((costCenter) => costCenter.active),
  },
  {
    key: 'inactive',
    title: t('costCenters.inactiveSection'),
    costCenters: costCenters.value.filter((costCenter) => !costCenter.active),
  },
]);
const selectedCostCenterData = computed(() => {
  if (!selectedCostCenter.value || selectedCostCenter.value === 'new') return null;
  return costCenters.value.find(
    (costCenter) => costCenter._id === selectedCostCenter.value,
  ) ?? null;
});

function getRouteCostCenterId() {
  const id = route.params.id;
  if (Array.isArray(id)) return id[0] ?? null;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function getCostCenterPath(id: string | null) {
  return id ? `${basePath}/${id}` : basePath;
}

function selectCostCenter(id: string) {
  selectedCostCenter.value = id;
}

function clearSelection() {
  selectedCostCenter.value = null;
}

function saveCostCenter(costCenter: CostCenterData) {
  const parsed = costCenterSchema.safeParse(costCenter);

  if (!parsed.success) {
    console.warn('Unexpected response format for saved cost center:', parsed.error);
    return;
  }

  const index = costCenters.value.findIndex((item) => item._id === parsed.data._id);
  if (index >= 0) costCenters.value.splice(index, 1, parsed.data);
  else costCenters.value.push(parsed.data);
}

function getCurrencies(costCenter: CostCenter) {
  return [costCenter.limit?.currency ?? systemStore.defaultCurrency];
}

function getCategories(costCenter: CostCenter) {
  const selectedIds = new Set(costCenter.categoryIds);
  return appStore.categories.filter(
    (category) => category.active && selectedIds.has(category._id),
  );
}

async function load() {
  loading.value = true;

  try {
    const result = await $userApi<CostCenterData[]>('/cost-centers');

    if (Array.isArray(result)) {
      costCenters.value = result.flatMap((item) => {
        const parsed = costCenterSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
    } else {
      console.warn('Unexpected response format for cost centers:', result);
    }
  } finally {
    loading.value = false;
  }
}

watchEffect(() => {
  route.meta.title = t('costCenters.pageTitle');
});

watch(
  () => route.params.id,
  () => {
    selectedCostCenter.value = getRouteCostCenterId();
  },
);

watch(selectedCostCenter, async (id) => {
  const targetPath = getCostCenterPath(id);
  if (route.path !== targetPath) await router.push(targetPath);
});

load();
</script>

<template>
  <Teleport to="#ci_cta">
    <button class="btn btn-light" @click="selectCostCenter('new')">
      <i class="bi bi-plus-lg me-1" /> {{ t('costCenters.add') }}
    </button>
  </Teleport>

  <LayoutPage>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span v-if="costCenters.length" class="text-muted ms-3">
        {{ t('costCenters.count', costCenters.length) }}
      </span>
    </div>

    <PageLoading v-if="loading">{{ t('costCenters.loading') }}</PageLoading>

    <div v-else-if="costCenters.length" class="mt-3">
      <section
        v-for="section in sections"
        :key="section.key"
        class="cost-center-section"
        :aria-labelledby="`cost-center-${section.key}`"
      >
        <SectionHeader
          :id="`cost-center-${section.key}`"
          :title="section.title"
        />

        <div v-if="section.costCenters.length" class="d-grid gap-3 mt-3">
          <article
            v-for="costCenter in section.costCenters"
            :key="costCenter._id"
            class="card shadow-sm"
            :class="{ 'opacity-50': !costCenter.active }"
          >
            <div class="card-body">
              <div class="d-flex align-items-center gap-3">
                <h5 class="card-title text-truncate mb-0 me-auto">{{ costCenter.name }}</h5>
                <CurrencyList
                  :currencies="getCurrencies(costCenter)"
                  :title="t('costCenters.defaultCurrency')"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary flex-shrink-0"
                  :aria-label="t('costCenters.edit', { name: costCenter.name })"
                  @click="selectCostCenter(costCenter._id)"
                >
                  <i class="bi bi-pencil" aria-hidden="true" />
                </button>
              </div>

              <small
                class="cost-center-description d-block text-muted fst-italic text-truncate mt-2"
              >
                {{ costCenter.description || t('costCenters.noDescription') }}
              </small>

              <p class="mb-0 mt-3">
                <template v-if="costCenter.limit">
                  <span class="text-body-secondary">{{ t('costCenters.limit') }}:</span>
                  <MoneyDisplay class="mx-1" :money="costCenter.limit" />
                  <span class="text-body-secondary">{{ t('costCenters.monthly') }}</span>
                </template>
                <span v-else class="text-muted small">{{ t('costCenters.noLimit') }}</span>
              </p>

              <div
                class="category-line border-top mt-3 pt-3"
                :aria-label="t('costCenters.categories')"
              >
                <span
                  v-for="category in getCategories(costCenter)"
                  :key="category._id"
                  class="badge rounded-pill text-bg-light border me-1"
                >
                  {{ category.name }}
                </span>
                <span v-if="getCategories(costCenter).length === 0" class="text-muted small">
                  {{ t('costCenters.noCategories') }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <p v-else class="text-body-secondary small ms-3 mt-3">
          {{ t('costCenters.emptySection') }}
        </p>
      </section>
    </div>

    <div v-else class="card border-0 bg-body-tertiary mt-3">
      <div class="card-body text-center py-5">
        <i class="bi bi-diagram-3-fill fs-1 text-body-tertiary" aria-hidden="true" />
        <h5 class="mt-3">{{ t('costCenters.emptyTitle') }}</h5>
        <p class="text-muted mb-0">{{ t('costCenters.emptyDescription') }}</p>
      </div>
    </div>

    <CanvasCostCenter
      :id="selectedCostCenter"
      :cost-center="selectedCostCenterData"
      @close="clearSelection"
      @saved="saveCostCenter"
    />
  </LayoutPage>
</template>

<style scoped>
.cost-center-section + .cost-center-section {
  margin-top: 3rem;
}

.cost-center-description {
  max-width: 100%;
}

.category-line {
  overflow: hidden;
  white-space: nowrap;
}
</style>
