<script setup lang="ts">
import type { TransactionCategory } from '~~/shared/types/transactions';

interface CategoryListItem {
  category: TransactionCategory;
  depth: number;
  hasChildren: boolean;
}

const props = withDefaults(
  defineProps<{
    categories: TransactionCategory[]
    disabled?: boolean
    emptyLabel?: string
    modelValue: string[]
  }>(),
  {
    disabled: false,
    emptyLabel: 'Nenhuma categoria disponível.',
  },
);

const emit = defineEmits<{
  'update:modelValue': [categoryIds: string[]];
}>();

const componentId = useId();
const selectedIds = computed(() => new Set(props.modelValue));
const categoriesById = computed(
  () => new Map(props.categories.map((category) => [category._id, category])),
);
const childrenByParent = computed(() => {
  const children = new Map<string, TransactionCategory[]>();

  for (const category of props.categories) {
    if (!category.parentId || !categoriesById.value.has(category.parentId)) continue;

    const siblings = children.get(category.parentId) ?? [];
    siblings.push(category);
    children.set(category.parentId, siblings);
  }

  return children;
});

const categoryItems = computed<CategoryListItem[]>(() => {
  const categoryIds = new Set(props.categories.map((category) => category._id));
  const roots: TransactionCategory[] = [];

  for (const category of props.categories) {
    if (!category.parentId || !categoryIds.has(category.parentId)) {
      roots.push(category);
    }
  }

  const items: CategoryListItem[] = [];
  const visited = new Set<string>();

  function appendCategory(category: TransactionCategory, depth: number) {
    if (visited.has(category._id)) return;

    visited.add(category._id);
    const children = childrenByParent.value.get(category._id) ?? [];
    items.push({ category, depth, hasChildren: children.length > 0 });

    for (const child of children) appendCategory(child, depth + 1);
  }

  for (const category of roots) appendCategory(category, 0);

  // Mantém visíveis categorias com referências circulares ou inconsistentes.
  for (const category of props.categories) appendCategory(category, 0);

  return items;
});

const selectedCount = computed(() =>
  categoryItems.value.reduce(
    (count, item) => count + Number(selectedIds.value.has(item.category._id)),
    0,
  ),);

const allCategoriesSelected = computed(
  () =>
    categoryItems.value.length > 0
    && categoryItems.value.every((item) => selectedIds.value.has(item.category._id))
    && props.modelValue.length === categoryItems.value.length,
);

function toggleCategory(categoryId: string, selected: boolean) {
  const nextIds = new Set(props.modelValue);
  const affectedIds = getCategoryTreeIds(categoryId);

  for (const affectedId of affectedIds) {
    selected ? nextIds.add(affectedId) : nextIds.delete(affectedId);
  }

  syncParentSelection(categoryId, nextIds);
  emit('update:modelValue', [...nextIds]);
}

function getCategoryTreeIds(categoryId: string): string[] {
  const categoryIds: string[] = [];
  const pendingIds = [categoryId];
  const visited = new Set<string>();

  while (pendingIds.length > 0) {
    const currentId = pendingIds.pop();
    if (!currentId || visited.has(currentId)) continue;

    visited.add(currentId);
    categoryIds.push(currentId);

    for (const child of childrenByParent.value.get(currentId) ?? []) {
      pendingIds.push(child._id);
    }
  }

  return categoryIds;
}

function syncParentSelection(categoryId: string, nextIds: Set<string>) {
  const visited = new Set<string>();
  let parentId = categoriesById.value.get(categoryId)?.parentId;

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const children = childrenByParent.value.get(parentId) ?? [];

    if (children.length > 0 && children.every((child) => nextIds.has(child._id)))
      nextIds.add(parentId);
    else nextIds.delete(parentId);

    parentId = categoriesById.value.get(parentId)?.parentId;
  }
}

function isCategoryIndeterminate(categoryId: string): boolean {
  if (selectedIds.value.has(categoryId)) return false;

  return getCategoryTreeIds(categoryId).some(
    (descendantId) => descendantId !== categoryId && selectedIds.value.has(descendantId),
  );
}

function handleCategoryChange(categoryId: string, event: Event) {
  toggleCategory(categoryId, (event.target as HTMLInputElement).checked);
}

function selectAll() {
  emit(
    'update:modelValue',
    categoryItems.value.map((item) => item.category._id),
  );
}

function clearSelection() {
  emit('update:modelValue', []);
}
</script>

<template>
  <fieldset class="category-selection-list border rounded" :disabled="props.disabled">
    <legend class="visually-hidden">Categorias disponíveis</legend>

    <div
      class="d-flex align-items-center justify-content-between gap-2 border-bottom bg-body-tertiary px-3 py-2"
    >
      <small class="text-body-secondary">
        {{ selectedCount }} de {{ categoryItems.length }} selecionadas
      </small>
      <div class="btn-group btn-group-sm" role="group" aria-label="Ações da seleção de categorias">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="allCategoriesSelected"
          @click="selectAll"
        >
          Selecionar todas
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="props.modelValue.length === 0"
          @click="clearSelection"
        >
          Limpar
        </button>
      </div>
    </div>

    <ul v-if="categoryItems.length" class="list-group list-group-flush">
      <li
        v-for="item in categoryItems"
        :key="item.category._id"
        class="list-group-item category-selection-item"
        :style="{ '--category-depth': item.depth }"
      >
        <div class="form-check mb-0">
          <input
            :id="`${componentId}_${item.category._id}`"
            type="checkbox"
            class="form-check-input"
            :checked="selectedIds.has(item.category._id)"
            :indeterminate="isCategoryIndeterminate(item.category._id)"
            @change="handleCategoryChange(item.category._id, $event)"
          />
          <label
            class="form-check-label d-flex align-items-center gap-2 w-100"
            :class="{ 'fw-semibold': item.hasChildren }"
            :for="`${componentId}_${item.category._id}`"
          >
            <i
              v-if="item.depth > 0"
              class="bi bi-arrow-return-right text-body-tertiary"
              aria-hidden="true"
            />
            <span
              class="category-color"
              :style="{ backgroundColor: item.category.color }"
              aria-hidden="true"
            />
            <span>{{ item.category.name }}</span>
          </label>
        </div>
      </li>
    </ul>

    <p v-else class="text-body-secondary small text-center mb-0 p-3">{{ props.emptyLabel }}</p>
  </fieldset>
</template>

<style scoped>
.category-selection-list {
  max-height: 22rem;
  overflow-y: auto;
}

.category-selection-list > div:first-of-type {
  position: sticky;
  top: 0;
  z-index: 1;
}

.category-selection-item {
  padding-inline-start: calc(0.75rem + (var(--category-depth) * 1.5rem));
}

.category-color {
  width: 0.75rem;
  height: 0.75rem;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 50%;
}

@media (max-width: 575.98px) {
  .category-selection-list > div:first-of-type {
    align-items: stretch !important;
    flex-direction: column;
  }
}
</style>
