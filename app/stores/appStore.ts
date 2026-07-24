import { getLocalizedCategoryName } from '~~/shared/utils/categories';

import type {
  Category,
  CategoryConfiguration,
  ResolvedUserCategory,
} from '~~/shared/schemas/categories';
import type { TransactionTypeDisplay } from '~~/shared/types/transactions';
import type { UserPreference } from '~~/shared/schemas/userPreferences';
import type { Currency } from '~~/shared/types/finances';

import isoCodeToCurrency from '~/utils/isoCodeToCurrency';

import useSystemStore from './systemStore';

export interface AppState {
  currencies: Currency[]
  catalogCategories: Category[]
  categories: ResolvedUserCategory[]
  transactionTypes: TransactionTypeDisplay[]
  lastInputDate: Date | null
  lastInputCategoryId: string | null
  lastInputSourceId: string | null
}

export interface UserProfile {
  _id: string
  name: string
  email: string
  active: boolean
  avatarUrl: string
  createdAt: string | null
  updatedAt: string | null
  lastAccessAt: string | null
}

interface I18nInjection {
  locale: { value: string }
}

export const useAppStore = defineStore('appStore', () => {
  const { user } = useUserSession();
  const { $i18n } = useNuxtApp() as unknown as { $i18n: I18nInjection };
  const systemStore = useSystemStore();

  const loading = ref(false);
  const userProfile = ref<UserProfile | null>(null);
  const currencies = ref<Currency[]>([]);
  const catalogCategories = ref<Category[]>([]);
  const categories = ref<ResolvedUserCategory[]>([]);
  const transactionTypes = ref<TransactionTypeDisplay[]>([
    { code: 'EXPENSE', label: 'Despesa' },
    { code: 'INCOME', label: 'Receita' },
    { code: 'TRANSFER', label: 'Transferência' },
    { code: 'CONTRIBUTION', label: 'Aporte' },
    { code: 'REDEMPTION', label: 'Resgate' },
  ]);
  const lastInputDate = ref<Date | null>(null);
  const lastInputCategoryId = ref<string | null>(null);
  const lastInputSourceId = ref<string | null>(null);

  function setCurrencyList(currencyList: Currency[]) {
    currencies.value = currencyList;
  }

  function setUserProfile(profile: UserProfile) {
    userProfile.value = profile;
  }

  async function getUserProfile(force = false): Promise<UserProfile> {
    if (!user?.value?.id) throw new Error('User not logged in');
    if (!force && userProfile.value?._id === user.value.id) {
      return userProfile.value;
    }

    const requestFetch = import.meta.server ? useRequestFetch() : $fetch;
    const profile = await requestFetch<UserProfile>(
      `/api/users/${user.value.id}`,
    );
    setUserProfile(profile);
    return profile;
  }

  async function getUserPreferences() {
    if (!user?.value?.id) throw new Error('User not logged in');

    const requestFetch = import.meta.server ? useRequestFetch() : $fetch;
    const preference = await requestFetch<UserPreference>(
      `/api/users/${user.value.id}/user_preferences`,
    );
    currencies.value = preference.currencies.map((code) =>
      isoCodeToCurrency(code));
    systemStore.setDefaultCurrency(preference.defaultCurrency);
  }

  function setLastInputDate(date: Date | null) {
    lastInputDate.value = date;
  }

  function setLastInputCategoryId(categoryId: string | null) {
    lastInputCategoryId.value = categoryId;
  }

  function setLastInputSourceId(sourceId: string | null) {
    lastInputSourceId.value = sourceId;
  }

  async function getCategories() {
    if (!user?.value?.id) throw new Error('User not logged in');

    loading.value = true;

    try {
      const requestFetch = import.meta.server ? useRequestFetch() : $fetch;
      const configuration = await requestFetch<CategoryConfiguration>(
        `/api/users/${user.value.id}/categories`,
      );

      if (configuration) {
        catalogCategories.value = configuration.catalog;
        const catalogById = new Map(
          configuration.catalog.map((category) => [category._id, category]),
        );

        categories.value = configuration.categories.reduce<
          ResolvedUserCategory[]
        >((resolved, category) => {
          if (category.name) {
            resolved.push({
              ...category,
              name: category.name,
              source: 'custom',
            });
            return resolved;
          }

          const catalogCategory = category.catalogCategoryId
            ? catalogById.get(category.catalogCategoryId)
            : undefined;
          if (!catalogCategory) return resolved;

          resolved.push({
            ...category,
            name: getLocalizedCategoryName(
              catalogCategory.name,
              $i18n.locale.value,
            ),
            active: category.active && catalogCategory.active,
            source: 'system',
          });
          return resolved;
        }, []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      systemStore.addMessage(
        'Erro ao carregar categorias de transações.',
        'Falha',
        'danger',
        'bi-exclamation-diamond',
        3,
      );
    } finally {
      loading.value = false;
    }
  }

  watch(() => $i18n.locale.value, (currentLocale) => {
    const catalogById = new Map(
      catalogCategories.value.map((category) => [category._id, category]),
    );

    categories.value = categories.value.map((category) => {
      if (category.source !== 'system' || !category.catalogCategoryId) {
        return category;
      }

      const catalogCategory = catalogById.get(category.catalogCategoryId);
      return catalogCategory
        ? {
            ...category,
            name: getLocalizedCategoryName(
              catalogCategory.name,
              currentLocale,
            ),
          }
        : category;
    });
  });

  return {
    loading,
    userProfile,
    currencies,
    catalogCategories,
    categories,
    transactionTypes,
    lastInputDate,
    lastInputCategoryId,
    lastInputSourceId,
    setCurrencyList,
    setUserProfile,
    setLastInputDate,
    setLastInputCategoryId,
    setLastInputSourceId,
    getUserPreferences,
    getUserProfile,
    getCategories,
  };
});
