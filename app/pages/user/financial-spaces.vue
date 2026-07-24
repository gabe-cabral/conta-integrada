<script setup lang="ts">
import {
  type FinancialSpace,
  type FinancialSpaceData,
  financialSpaceSchema,
} from '~~/shared/schemas/financialSpaces';

import { useFinanceStore } from '~/stores/financeStore';
import { useAppStore } from '~/stores/appStore';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Espaços',
});

const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const financeStore = useFinanceStore();

const loading = ref(true);
const financialSpaces = ref<FinancialSpace[]>([]);
const selectedFinancialSpace = ref<string | null>(getRouteFinancialSpaceId());

const basePath = '/user/financial-spaces';
const visibleAccounts = computed(() => financeStore.accounts.slice(0, 3));
const visibleCards = computed(() => financeStore.cards.slice(0, 2));
const additionalAccounts = computed(() =>
  Math.max(0, financeStore.accounts.length - visibleAccounts.value.length));
const additionalCards = computed(() =>
  Math.max(0, financeStore.cards.length - visibleCards.value.length));
const selectedFinancialSpaceData = computed(() => {
  if (!selectedFinancialSpace.value || selectedFinancialSpace.value === 'new') return null;
  return financialSpaces.value.find((space) => space._id === selectedFinancialSpace.value) ?? null;
});

function getRouteFinancialSpaceId() {
  const id = route.params.id;
  if (Array.isArray(id)) return id[0] ?? null;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function getFinancialSpacePath(id: string | null) {
  return id ? `${basePath}/${id}` : basePath;
}

function selectFinancialSpace(id: string) {
  selectedFinancialSpace.value = id;
}

function clearSelection() {
  selectedFinancialSpace.value = null;
}

function saveFinancialSpace(financialSpace: FinancialSpaceData) {
  const parsed = financialSpaceSchema.safeParse(financialSpace);

  if (!parsed.success) {
    console.warn('Unexpected response format for saved financial space:', parsed.error);
    return;
  }

  const index = financialSpaces.value.findIndex((space) => space._id === parsed.data._id);
  if (index >= 0) financialSpaces.value.splice(index, 1, parsed.data);
  else financialSpaces.value.push(parsed.data);
}

function getCurrencies(financialSpace: FinancialSpace) {
  return financialSpace.currencies?.length
    ? financialSpace.currencies
    : appStore.currencies.map((currency) => currency.code);
}

function getCategories(financialSpace: FinancialSpace) {
  if (financialSpace.categoryMode === 'all') {
    return appStore.categories.filter((category) => category.active);
  }
  const selectedIds = new Set(financialSpace.categoryIds);
  return appStore.categories.filter(
    (category) => category.active && selectedIds.has(category._id),
  );
}

async function load() {
  loading.value = true;

  try {
    const result = await $userApi<FinancialSpaceData[]>('/financial-spaces');

    if (Array.isArray(result)) {
      financialSpaces.value = result.flatMap((item) => {
        const parsed = financialSpaceSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
    } else {
      console.warn('Unexpected response format for financial spaces:', result);
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    selectedFinancialSpace.value = getRouteFinancialSpaceId();
  },
);

watch(selectedFinancialSpace, async (id) => {
  const targetPath = getFinancialSpacePath(id);
  if (route.path !== targetPath) await router.push(targetPath);
});

load();
</script>

<template>
  <Teleport to="#ci_cta">
    <button class="btn btn-light" @click="selectFinancialSpace('new')">
      <i class="bi bi-plus-lg me-1" /> Adicionar espaço
    </button>
  </Teleport>

  <LayoutPage>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span v-if="financialSpaces.length" class="text-muted ms-3">
        {{ financialSpaces.length }} {{ financialSpaces.length === 1 ? 'espaço' : 'espaços' }}
      </span>
    </div>

    <PageLoading v-if="loading">Carregando espaços...</PageLoading>

    <div v-else-if="financialSpaces.length" class="d-grid gap-3 mt-3">
      <article
        v-for="financialSpace in financialSpaces"
        :key="financialSpace._id"
        class="card financial-space-card shadow-sm"
        role="button"
        tabindex="0"
        :aria-label="`Editar espaço ${financialSpace.name}`"
        @click="selectFinancialSpace(financialSpace._id)"
        @keydown.enter.prevent="selectFinancialSpace(financialSpace._id)"
      >
        <div class="card-body">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <i class="bi bi-grip-vertical text-body-tertiary" aria-hidden="true" />
            <i
              :class="`bi bi-${financialSpace.icon ?? 'house-fill'} fs-4`"
              :style="{ color: financialSpace.color }"
              aria-hidden="true"
            />
            <h5 class="card-title mb-0 me-auto" :style="{ color: financialSpace.color }">
              {{ financialSpace.name }}
            </h5>
            <span class="font-monospace small text-body-secondary me-4" title="Moedas aceitas">
              {{ getCurrencies(financialSpace).join(' · ') }}
            </span>
            <span class="text-success fw-semibold" title="Representatividade nas receitas">
              <i class="bi bi-arrow-up-right me-1" />80%
            </span>
            <span class="text-danger fw-semibold" title="Representatividade nos gastos">
              <i class="bi bi-arrow-down-right me-1" />50%
            </span>
          </div>

          <p class="card-text text-body-secondary mt-2 mb-4">
            {{ financialSpace.description || 'Sem descrição cadastrada.' }}
          </p>

          <div class="row g-4">
            <section class="col-12 col-xl-6" aria-label="Contas do espaço">
              <h6 class="text-uppercase font-monospace text-body-secondary">Contas</h6>
              <div v-if="visibleAccounts.length" class="space-resource-list">
                <AccountWidget
                  v-for="(account, index) in visibleAccounts"
                  :key="account._id ?? `${account.brand}-${index}`"
                  :account="account"
                  class="space-resource-widget"
                />
                <span v-if="additionalAccounts" class="additional-count badge text-bg-light border">
                  +{{ additionalAccounts }}
                </span>
              </div>
              <p v-else class="text-muted small mb-0">Nenhuma conta disponível.</p>
            </section>

            <section class="col-12 col-xl-6" aria-label="Cartões do espaço">
              <h6 class="text-uppercase font-monospace text-body-secondary">Cartões</h6>
              <div v-if="visibleCards.length" class="space-resource-list">
                <CardWidget
                  v-for="(card, index) in visibleCards"
                  :key="`${card.brand}-${card.number}-${index}`"
                  :card="card"
                  class="space-resource-widget"
                />
                <span v-if="additionalCards" class="additional-count badge text-bg-light border">
                  +{{ additionalCards }}
                </span>
              </div>
              <p v-else class="text-muted small mb-0">Nenhum cartão disponível.</p>
            </section>
          </div>

          <div class="category-line border-top mt-4 pt-3" aria-label="Categorias disponíveis">
            <span
              v-for="category in getCategories(financialSpace)"
              :key="category._id"
              class="badge rounded-pill text-bg-light border me-1"
            >
              {{ category.name }}
            </span>
            <span v-if="getCategories(financialSpace).length === 0" class="text-muted small">
              Nenhuma categoria selecionada.
            </span>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="card border-0 bg-body-tertiary mt-3">
      <div class="card-body text-center py-5">
        <i class="bi bi-grid-1x2-fill fs-1 text-body-tertiary" aria-hidden="true" />
        <h5 class="mt-3">Crie seu primeiro espaço</h5>
        <p class="text-muted mb-0">Separe contas, cartões e categorias por contexto financeiro.</p>
      </div>
    </div>

    <CanvasFinancialSpace
      :id="selectedFinancialSpace"
      :financial-space="selectedFinancialSpaceData"
      @close="clearSelection"
      @saved="saveFinancialSpace"
    />
  </LayoutPage>
</template>

<style scoped>
.financial-space-card {
  cursor: pointer;
}

.financial-space-card:focus-visible {
  outline: 0.2rem solid rgba(var(--bs-primary-rgb), 0.35);
  outline-offset: 0.15rem;
}

.space-resource-list {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.space-resource-list :deep(.space-resource-widget.card) {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}

.space-resource-list :deep(.card-body) {
  min-width: 0;
  padding: 0.85rem;
}

.additional-count {
  align-self: center;
  flex: 0 0 auto;
}

.category-line {
  overflow: hidden;
  white-space: nowrap;
}

@media (max-width: 767.98px) {
  .space-resource-list {
    flex-wrap: wrap;
  }

  .space-resource-list :deep(.space-resource-widget.card) {
    flex-basis: 100%;
  }

  .additional-count {
    flex-basis: 100%;
    width: fit-content;
  }
}
</style>
