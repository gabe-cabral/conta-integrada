<script setup lang="ts">
import type { CurrencyDetail as CatalogCurrency } from '~~/shared/schemas/currency';
import type { ColorModePreference } from '~/composables/useColorMode';
import type { Currency } from '~~/shared/types/finances';

import useSystemStore from '~/stores/systemStore';
import { useAppStore } from '~/stores/appStore';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Preferências',
});

type CurrencyOption = Pick<CatalogCurrency, '_id' | 'names' | 'symbol'>;
type AppLocale = 'en' | 'es-CO' | 'pt-BR';

const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const { locale, locales, setLocale, t } = useI18n();
const appStore = useAppStore();
const systemStore = useSystemStore();
const route = useRoute();
const colorMode = useColorMode();

const loading = ref(true);
const saving = ref(false);
const changingLocale = ref(false);

const availableCurrencyCodes = ref<string[]>([]);
const userSelectedCurrencies = ref<string[]>(appStore.currencies.map((currency) => currency.code));
const defaultCurrency = ref<string | null>(systemStore.defaultCurrency);

const availableCurrencies = computed<Currency[]>(() =>
  availableCurrencyCodes.value.map((code) => isoCodeToCurrency(code, locale.value)));

const userCurrencies = computed(() =>
  availableCurrencies.value.filter((currency) =>
    userSelectedCurrencies.value.includes(currency.code)));

const localeOptions = computed(() => locales.value.map((availableLocale) => {
  if (typeof availableLocale === 'string') {
    return { code: availableLocale, name: availableLocale };
  }

  return {
    code: availableLocale.code,
    name: availableLocale.name ?? availableLocale.code,
  };
}));

const themeOptions = computed<Array<{
  description: string
  icon: string
  label: string
  value: ColorModePreference
}>>(() => [
  {
    value: 'auto',
    icon: 'circle-half',
    label: t('preferences.appearance.auto'),
    description: t('preferences.appearance.autoDescription'),
  },
  {
    value: 'light',
    icon: 'sun-fill',
    label: t('preferences.appearance.light'),
    description: t('preferences.appearance.lightDescription'),
  },
  {
    value: 'dark',
    icon: 'moon-stars-fill',
    label: t('preferences.appearance.dark'),
    description: t('preferences.appearance.darkDescription'),
  },
]);

watch(
  userSelectedCurrencies,
  (selectedCurrencies) => {
    if (!defaultCurrency.value || selectedCurrencies.includes(defaultCurrency.value)) return;
    defaultCurrency.value = selectedCurrencies[0] ?? null;
  },
  { immediate: true },
);

async function load() {
  loading.value = true;

  try {
    const currencies = await $fetch<CurrencyOption[]>('/api/currencies');

    availableCurrencyCodes.value = currencies.map((currency) => currency._id);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!defaultCurrency.value || userSelectedCurrencies.value.length === 0) return;

  saving.value = true;

  try {
    await $userApi('/user_preferences', {
      method: 'PUT',
      body: {
        defaultCurrency: defaultCurrency.value,
        currencies: userSelectedCurrencies.value,
      },
    });

    await appStore.getUserPreferences();
    systemStore.addMessage(
      t('preferences.currencies.successMessage'),
      t('preferences.currencies.successTitle'),
      'success',
      'bi-check-circle',
      3,
    );
  } finally {
    saving.value = false;
  }
}

async function changeLocale(event: Event) {
  const selectedLocale = (event.target as HTMLSelectElement).value as AppLocale;

  if (selectedLocale === locale.value) return;

  changingLocale.value = true;

  try {
    await setLocale(selectedLocale);
  } finally {
    changingLocale.value = false;
  }
}

watchEffect(() => {
  route.meta.title = t('preferences.pageTitle');
});

onMounted(() => {
  colorMode.initialize();
  load();
});
</script>

<template>
  <LayoutPage>
    <section class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">{{ t('preferences.appearance.title') }}</h5>
        <h6 class="card-subtitle mb-4 text-body-secondary">
          {{ t('preferences.appearance.description') }}
        </h6>

        <fieldset>
          <legend class="form-label fs-6">{{ t('preferences.appearance.theme') }}</legend>

          <div class="row g-3">
            <div v-for="theme in themeOptions" :key="theme.value" class="col-12 col-md-4">
              <input
                :id="`theme-${theme.value}`"
                :checked="colorMode.preference.value === theme.value"
                class="btn-check"
                type="radio"
                name="theme"
                :value="theme.value"
                @change="colorMode.setPreference(theme.value)"
              />
              <label
                class="btn btn-outline-secondary d-flex h-100 align-items-start p-3 text-start"
                :for="`theme-${theme.value}`"
              >
                <i class="bi me-3 fs-4" :class="`bi-${theme.icon}`" aria-hidden="true" />
                <span>
                  <strong class="d-block">{{ theme.label }}</strong>
                  <small class="text-body-secondary">{{ theme.description }}</small>
                </span>
              </label>
            </div>
          </div>
        </fieldset>
      </div>
    </section>

    <section class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">{{ t('preferences.language.title') }}</h5>
        <h6 class="card-subtitle mb-4 text-body-secondary">
          {{ t('preferences.language.description') }}
        </h6>

        <label for="interfaceLanguage" class="form-label">
          {{ t('preferences.language.label') }}
        </label>
        <select
          id="interfaceLanguage"
          class="form-select"
          :value="locale"
          :disabled="changingLocale"
          @change="changeLocale"
        >
          <option v-for="option in localeOptions" :key="option.code" :value="option.code">
            {{ option.name }}
          </option>
        </select>
        <div class="form-text">
          {{ changingLocale
            ? t('preferences.language.saving')
            : t('preferences.language.persisted') }}
        </div>
      </div>
    </section>

    <form class="card" @submit.prevent="save">
      <div class="card-body">
        <h5 class="card-title">{{ t('preferences.currencies.title') }}</h5>
        <h6 class="card-subtitle mb-4 text-body-secondary">
          {{ t('preferences.currencies.description') }}
        </h6>

        <PageLoading v-if="loading">{{ t('preferences.currencies.loading') }}</PageLoading>

        <template v-else>
          <div class="mb-3">
            <label for="currencies" class="form-label">
              {{ t('preferences.currencies.usedCurrencies') }}
            </label>
            <MultiSelectField
              id="currencies"
              v-model="userSelectedCurrencies"
              :options="
                availableCurrencies.map((c) => ({ value: c.code, label: `${c.label} (${c.code})` }))
              "
              class="form-select"
              :placeholder="t('preferences.currencies.placeholder')"
              :aria-label="t('preferences.currencies.availableAriaLabel')"
              :multiple="true"
            />
          </div>

          <div class="mb-3">
            <label for="defaultCurrency" class="form-label">
              {{ t('preferences.currencies.defaultCurrency') }}
            </label>
            <select
              id="defaultCurrency"
              v-model="defaultCurrency"
              class="form-select"
              :aria-label="t('preferences.currencies.defaultAriaLabel')"
            >
              <option
                v-for="currency in userCurrencies"
                :key="currency.code"
                :value="currency.code"
              >
                {{ currency.label }} ({{ currency.code }})
              </option>
            </select>
          </div>
        </template>
      </div>

      <div class="card-footer text-end">
        <button type="submit" class="btn btn-primary" :disabled="loading || saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
          {{ t('preferences.currencies.save') }}
        </button>
      </div>
    </form>
  </LayoutPage>
</template>
