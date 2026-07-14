<script setup lang="ts">
import type { CurrencyDetail as CatalogCurrency } from '~~/shared/schemas/currency';
import type { Currency } from '~~/shared/types/finances';
import { useAppStore } from '~/stores/appStore';
import useSystemStore from '~/stores/systemStore';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Preferências',
});

type CurrencyOption = Pick<CatalogCurrency, '_id' | 'names' | 'symbol'>;

const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const appStore = useAppStore();
const systemStore = useSystemStore();

const loading = ref(true);
const saving = ref(false);

const availableCurrencies = ref<Currency[]>([]);
const userSelectedCurrencies = ref<string[]>(appStore.currencies.map((currency) => currency.code));
const defaultCurrency = ref<string | null>(systemStore.defaultCurrency);

const userCurrencies = computed(
  () => availableCurrencies.value.filter(
    (currency) => userSelectedCurrencies.value.includes(currency.code)));

watch(userSelectedCurrencies, (selectedCurrencies) => {
  if (!defaultCurrency.value || selectedCurrencies.includes(defaultCurrency.value)) return;
  defaultCurrency.value = selectedCurrencies[0] ?? null;
}, { immediate: true });

async function load() {
  loading.value = true;

  try {
    const currencies = await $fetch<CurrencyOption[]>('/api/currencies');

    availableCurrencies.value = currencies.map((currency) => isoCodeToCurrency(currency._id));
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
    systemStore.addMessage('Preferências atualizadas com sucesso.', 'Preferências', 'success', 'bi-check-circle', 3);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <LayoutPage>
    <PageLoading v-if="loading">Carregando preferências...</PageLoading>

    <form v-else class="card" @submit.prevent="save">
      <div class="card-body">
        <h5 class="card-title">Preferências</h5>
        <h6 class="card-subtitle mb-3 text-body-secondary">Moedas</h6>

        <div class="mb-3">
          <label for="currencies" class="form-label">Moedas utilizadas por mim</label>
          <MultiSelectField v-model="userSelectedCurrencies"
                            :options="availableCurrencies.map(c => ({ value: c.code, label: `${c.label} (${c.code})` }))"
                            id="currencies" class="form-select"
                            placeholder="Selecione as moedas utilizadas por você"
                            aria-label="Define as moedas disponíveis para uso"
                            :multiple="true" />
        </div>

        <div class="mb-3">
          <label for="defaultCurrency" class="form-label">Moeda padrão</label>
          <select id="defaultCurrency" class="form-select" v-model="defaultCurrency"
                  aria-label="Define a moeda padrão para exibição de valores">
            <option v-for="currency in userCurrencies" :key="currency.code" :value="currency.code">
              {{ currency.label }} ({{ currency.code }})
            </option>
          </select>
        </div>
      </div>

      <div class="card-footer text-end">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
          Salvar
        </button>
      </div>
    </form>
  </LayoutPage>
</template>
