<script setup lang="ts">
import type {
  CategoryKind,
  ResolvedUserCategory,
  UserCategory,
} from '~~/shared/schemas/categories';

import generateColorFromText from '~/utils/generateColorFromText';
import useSystemStore from '~/stores/systemStore';

interface CategoryForm {
  name: string
  kind: CategoryKind
  active: boolean
  color: string
}

const props = withDefaults(
  defineProps<{
    category?: ResolvedUserCategory | null
    id?: string | null
    parentCategory?: ResolvedUserCategory | null
  }>(),
  {
    category: null,
    id: null,
    parentCategory: null,
  },
);

const emit = defineEmits<{
  close: []
  saved: [category: UserCategory]
}>();

const { t } = useI18n();
const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const systemStore = useSystemStore();
const sending = ref(false);
const validated = ref(false);
const form = ref<CategoryForm | null>(null);
const kindInputName = `category_kind_${useId()}`;

const isActivity = computed(() => Boolean(props.parentCategory));
const title = computed(() => isActivity.value
  ? t('categories.form.activityTitle')
  : t('categories.form.categoryTitle'));

function syncForm() {
  validated.value = false;

  if (!props.id) {
    form.value = null;
    return;
  }

  if (props.id === 'new') {
    const kind = props.parentCategory?.kind ?? 'EXPENSE';
    form.value = {
      name: '',
      kind,
      active: true,
      color: props.parentCategory?.color
        ?? generateColorFromText(title.value, kind),
    };
    return;
  }

  form.value = props.category
    ? {
        name: props.category.name,
        kind: props.category.kind,
        active: props.category.active,
        color: props.category.color,
      }
    : null;
}

async function submit() {
  validated.value = true;
  if (!form.value || !form.value.name.trim()) return;

  sending.value = true;
  try {
    const category = props.id === 'new'
      ? await $userApi<UserCategory>('/categories', {
          method: 'POST',
          body: {
            name: form.value.name,
            kind: form.value.kind,
            level: isActivity.value ? 'ACTIVITY' : 'CATEGORY',
            parentId: props.parentCategory?._id ?? null,
            active: form.value.active,
            color: form.value.color,
          },
        })
      : await $userApi<UserCategory>(`/categories/${props.id}`, {
          method: 'PATCH',
          body: {
            name: form.value.name,
            active: form.value.active,
            color: form.value.color,
          },
        });

    systemStore.addMessage(
      t('categories.form.successMessage'),
      t('categories.pageTitle'),
      'success',
      'bi-check-circle-fill',
      3,
    );
    emit('saved', category);
  } finally {
    sending.value = false;
  }
}

watch(
  () => [props.id, props.category, props.parentCategory],
  syncForm,
  { immediate: true },
);
</script>

<template>
  <BaseCanvas
    :id="props.id"
    kind="category"
    :sending="sending"
    :submit-label="t('categories.form.save')"
    :title="title"
    :validated="validated"
    @close="emit('close')"
    @submit="submit"
  >
    <template v-if="form">
      <p v-if="props.parentCategory" class="text-body-secondary small">
        {{ t('categories.form.activityFor', { name: props.parentCategory.name }) }}
      </p>

      <div class="mb-3">
        <label for="category_name" class="form-label">
          {{ t('categories.form.name') }}
        </label>
        <input
          id="category_name"
          v-model.trim="form.name"
          type="text"
          class="form-control"
          maxlength="80"
          required
        />
        <div class="invalid-feedback">{{ t('categories.form.nameRequired') }}</div>
      </div>

      <div v-if="props.id === 'new' && !isActivity" class="mb-3">
        <label :id="`${kindInputName}_label`" class="form-label">
          {{ t('categories.form.kind') }}
        </label>
        <div
          class="btn-group w-100"
          role="group"
          :aria-labelledby="`${kindInputName}_label`"
        >
          <input
            :id="`${kindInputName}_income`"
            v-model="form.kind"
            type="radio"
            class="btn-check"
            :name="kindInputName"
            value="INCOME"
            autocomplete="off"
            required
          />
          <label
            class="btn btn-outline-primary"
            :for="`${kindInputName}_income`"
          >
            {{ t('categories.income') }}
          </label>

          <input
            :id="`${kindInputName}_expense`"
            v-model="form.kind"
            type="radio"
            class="btn-check"
            :name="kindInputName"
            value="EXPENSE"
            autocomplete="off"
            required
          />
          <label
            class="btn btn-outline-primary"
            :for="`${kindInputName}_expense`"
          >
            {{ t('categories.expense') }}
          </label>
        </div>
      </div>

      <ColorPicker
        id="category_color"
        v-model="form.color"
        :label="t('categories.form.color')"
      />

      <div class="form-check form-switch">
        <input
          id="category_active"
          v-model="form.active"
          type="checkbox"
          class="form-check-input"
        />
        <label for="category_active" class="form-check-label">
          {{ t('categories.form.active') }}
        </label>
      </div>
    </template>
  </BaseCanvas>
</template>
