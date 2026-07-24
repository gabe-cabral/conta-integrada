<script setup lang="ts">
import { getLocalizedCategoryName } from '~~/shared/utils/categories';

import type {
  CategoryKind,
  ResolvedUserCategory,
} from '~~/shared/schemas/categories';

import { useAppStore } from '~/stores/appStore';

interface CategoryView {
  key: string
  catalogId: string | null
  configurationId: string | null
  parentKey: string | null
  name: string
  active: boolean
  available: boolean
  adopted: boolean
  color: string
  kind: CategoryKind
  level: 'CATEGORY' | 'ACTIVITY'
  source: 'system' | 'custom'
  record: ResolvedUserCategory | null
}

definePageMeta({
  middleware: ['authenticated'],
  title: 'Categorias',
});

const { t, locale } = useI18n();
const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const loading = ref(true);
const updatingIds = ref(new Set<string>());
const expandedKeys = ref(new Set<string>());
const activeKind = ref<CategoryKind>('INCOME');
const selectedId = ref<string | null>(getRouteCategoryId());
const selectedParent = ref<ResolvedUserCategory | null>(null);

const collator = computed(() => new Intl.Collator(locale.value, {
  sensitivity: 'base',
  usage: 'sort',
}));

const categoryViews = computed<CategoryView[]>(() => {
  const configuredByCatalogId = new Map(
    appStore.categories
      .filter((category) => category.catalogCategoryId)
      .map((category) => [category.catalogCategoryId!, category]),
  );
  const viewKeyByConfigurationId = new Map<string, string>();

  for (const category of appStore.categories) {
    viewKeyByConfigurationId.set(
      category._id,
      category.catalogCategoryId ?? category._id,
    );
  }

  const catalogViews = appStore.catalogCategories.map<CategoryView>((category) => {
    const configuration = configuredByCatalogId.get(category._id) ?? null;
    return {
      key: category._id,
      catalogId: category._id,
      configurationId: configuration?._id ?? null,
      parentKey: category.parentId,
      name: getLocalizedCategoryName(category.name, locale.value),
      active: category.active && (configuration?.active ?? false),
      available: category.active,
      adopted: Boolean(configuration),
      color: category.color,
      kind: category.kind,
      level: category.level,
      source: 'system',
      record: configuration,
    };
  });

  const customViews = appStore.categories
    .filter((category) => category.source === 'custom')
    .map<CategoryView>((category) => ({
      key: category._id,
      catalogId: null,
      configurationId: category._id,
      parentKey: category.parentId
        ? viewKeyByConfigurationId.get(category.parentId) ?? category.parentId
        : null,
      name: category.name,
      active: category.active,
      available: true,
      adopted: true,
      color: category.color,
      kind: category.kind,
      level: category.level,
      source: 'custom',
      record: category,
    }));

  return [...catalogViews, ...customViews];
});

const rootCategories = computed(() => categoryViews.value
  .filter((category) =>
    category.kind === activeKind.value && category.level === 'CATEGORY')
  .sort(compareNames));

const selectedCategory = computed(() => {
  if (!selectedId.value || selectedId.value === 'new') return null;
  return appStore.categories.find((category) => category._id === selectedId.value) ?? null;
});
const canvasParent = computed(() => {
  if (selectedParent.value) return selectedParent.value;
  if (!selectedCategory.value?.parentId) return null;
  return appStore.categories.find(
    (category) => category._id === selectedCategory.value?.parentId,
  ) ?? null;
});

function compareNames(left: CategoryView, right: CategoryView) {
  return collator.value.compare(left.name, right.name);
}

function getActivities(parentKey: string) {
  return categoryViews.value
    .filter((category) => category.parentKey === parentKey)
    .sort(compareNames);
}

function getRouteCategoryId() {
  const id = route.params.id;
  if (Array.isArray(id)) return id[0] ?? null;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function getCategoryPath(id: string | null) {
  return id ? `/user/categories/${id}` : '/user/categories';
}

function toggleExpanded(key: string) {
  const next = new Set(expandedKeys.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expandedKeys.value = next;
}

function openNewCategory() {
  selectedParent.value = null;
  selectedId.value = 'new';
}

function openNewActivity(category: CategoryView) {
  if (!category.record) return;
  selectedParent.value = category.record;
  selectedId.value = 'new';
}

function editCategory(category: CategoryView) {
  if (category.source !== 'custom' || !category.configurationId) return;
  selectedParent.value = category.record?.level === 'ACTIVITY'
    ? appStore.categories.find((item) => item._id === category.record?.parentId) ?? null
    : null;
  selectedId.value = category.configurationId;
}

function closeCanvas() {
  selectedId.value = null;
  selectedParent.value = null;
}

async function toggleCategory(category: CategoryView, active: boolean) {
  const activities = active && category.level === 'CATEGORY'
    ? getActivities(category.key).filter((activity) => activity.available)
    : [];
  const targets = [category, ...activities];
  updatingIds.value = new Set([
    ...updatingIds.value,
    ...targets.map((target) => target.key),
  ]);

  try {
    await persistCategoryActive(category, active);
    await Promise.all(activities.map((activity) =>
      persistCategoryActive(activity, true)));

    await appStore.getCategories();
  } finally {
    const next = new Set(updatingIds.value);
    for (const target of targets) next.delete(target.key);
    updatingIds.value = next;
  }
}

async function persistCategoryActive(category: CategoryView, active: boolean) {
  if (category.configurationId) {
    await $userApi(`/categories/${category.configurationId}`, {
      method: 'PATCH',
      body: { active },
    });
  } else if (category.catalogId) {
    await $userApi('/categories', {
      method: 'POST',
      body: { catalogCategoryId: category.catalogId, active },
    });
  }
}

async function savedCategory() {
  await appStore.getCategories();
  closeCanvas();
}

async function load() {
  loading.value = true;
  try {
    await appStore.getCategories();
    expandedKeys.value = new Set(
      categoryViews.value
        .filter((category) => category.level === 'CATEGORY')
        .map((category) => category.key),
    );
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    selectedId.value = getRouteCategoryId();
  },
);

watch(selectedId, async (id) => {
  const targetPath = getCategoryPath(id);
  if (route.path !== targetPath) await router.push(targetPath);
});

load();
</script>

<template>
  <Teleport to="#ci_cta">
    <button class="btn btn-light" @click="openNewCategory">
      <i class="bi bi-plus-lg me-1" />{{ t('categories.addCategory') }}
    </button>
  </Teleport>

  <LayoutPage>
    <p class="text-body-secondary mt-3">{{ t('categories.description') }}</p>

    <ul class="nav nav-tabs" role="tablist" :aria-label="t('categories.pageTitle')">
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeKind === 'INCOME' }"
          role="tab"
          :aria-selected="activeKind === 'INCOME'"
          @click="activeKind = 'INCOME'"
        >
          {{ t('categories.income') }}
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeKind === 'EXPENSE' }"
          role="tab"
          :aria-selected="activeKind === 'EXPENSE'"
          @click="activeKind = 'EXPENSE'"
        >
          {{ t('categories.expense') }}
        </button>
      </li>
    </ul>

    <PageLoading v-if="loading">{{ t('categories.loading') }}</PageLoading>

    <div v-else class="tab-content bg-body border border-top-0 rounded-bottom p-3">
      <div class="tab-pane active" role="tabpanel">
        <div v-if="rootCategories.length" class="accordion category-list">
          <article
            v-for="category in rootCategories"
            :key="category.key"
            class="accordion-item"
            :class="{ 'category-inactive': !category.active }"
          >
            <div class="accordion-header d-flex align-items-center gap-2 pe-3">
              <button
                type="button"
                class="accordion-button flex-grow-0 w-auto pe-2"
                :class="{ collapsed: !expandedKeys.has(category.key) }"
                :aria-expanded="expandedKeys.has(category.key)"
                @click="toggleExpanded(category.key)"
              >
                <span
                  class="category-color me-2"
                  :style="{ backgroundColor: category.color }"
                  aria-hidden="true"
                />
                <span class="text-truncate">{{ category.name }}</span>
              </button>

              <button
                v-if="category.source === 'custom'"
                type="button"
                class="btn btn-sm btn-outline-secondary flex-shrink-0"
                :aria-label="t('categories.edit', { name: category.name })"
                @click="editCategory(category)"
              >
                <i class="bi bi-pencil" aria-hidden="true" />
              </button>

              <span class="badge text-bg-light border ms-auto">
                {{ category.source === 'system'
                  ? t('categories.standard')
                  : t('categories.custom') }}
              </span>

              <div class="form-check form-switch mb-0">
                <input
                  :id="`category_active_${category.key}`"
                  type="checkbox"
                  class="form-check-input"
                  :checked="category.active"
                  :disabled="!category.available || updatingIds.has(category.key)"
                  :aria-label="t('categories.toggle', { name: category.name })"
                  @change="toggleCategory(
                    category,
                    ($event.target as HTMLInputElement).checked,
                  )"
                />
              </div>

            </div>

            <div v-show="expandedKeys.has(category.key)" class="accordion-collapse">
              <div class="accordion-body pt-2">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <small class="text-body-secondary">{{ t('categories.activities') }}</small>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    :disabled="!category.record || !category.active"
                    @click="openNewActivity(category)"
                  >
                    <i class="bi bi-plus-lg me-1" />{{ t('categories.addActivity') }}
                  </button>
                </div>

                <ul v-if="getActivities(category.key).length" class="list-group list-group-flush">
                  <li
                    v-for="activity in getActivities(category.key)"
                    :key="activity.key"
                    class="list-group-item d-flex align-items-center gap-2 px-0"
                    :class="{ 'category-inactive': !activity.active }"
                  >
                    <span
                      class="category-color"
                      :style="{ backgroundColor: activity.color }"
                      aria-hidden="true"
                    />
                    <span>{{ activity.name }}</span>
                    <button
                      v-if="activity.source === 'custom'"
                      type="button"
                      class="btn btn-sm btn-outline-secondary flex-shrink-0"
                      :aria-label="t('categories.edit', { name: activity.name })"
                      @click="editCategory(activity)"
                    >
                      <i class="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <span class="badge text-bg-light border ms-auto">
                      {{ activity.source === 'system'
                        ? t('categories.standard')
                        : t('categories.custom') }}
                    </span>
                    <div class="form-check form-switch mb-0">
                      <input
                        :id="`activity_active_${activity.key}`"
                        type="checkbox"
                        class="form-check-input"
                        :checked="activity.active"
                        :disabled="
                          !activity.available
                          || !category.active
                          || updatingIds.has(activity.key)
                        "
                        :aria-label="t('categories.toggle', { name: activity.name })"
                        @change="toggleCategory(
                          activity,
                          ($event.target as HTMLInputElement).checked,
                        )"
                      />
                    </div>
                  </li>
                </ul>
                <p v-else class="small text-body-secondary mb-0">
                  {{ t('categories.noActivities') }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <p v-else class="text-body-secondary text-center my-4">
          {{ t('categories.empty') }}
        </p>
      </div>
    </div>

    <CanvasCategory
      :id="selectedId"
      :category="selectedCategory"
      :parent-category="canvasParent"
      @close="closeCanvas"
      @saved="savedCategory"
    />
  </LayoutPage>
</template>

<style scoped>
.category-inactive {
  opacity: 0.55;
}

.category-color {
  width: 0.8rem;
  height: 0.8rem;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 50%;
}

.accordion-button:not(.collapsed) {
  background: transparent;
  box-shadow: none;
}

.accordion-header .accordion-button {
  min-width: 0;
}
</style>
