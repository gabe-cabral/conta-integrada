<script setup lang="ts">
import { bankAccountSchema } from '~~/shared/schemas/bankAccounts.js';

import type { BankAccount, BankAccountData } from '~~/shared/schemas/bankAccounts.js';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Contas',
});

const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const accounts = ref<BankAccount[]>([]);
const selectedAccount = ref<string | null>(getRouteAccountId());

const accountBasePath = '/user/accounts';
const selectedAccountData = computed(() => {
  if (!selectedAccount.value || selectedAccount.value === 'new') return null;
  return accounts.value.find((account) => account._id === selectedAccount.value) ?? null;
});

function getRouteAccountId() {
  const id = route.params.id;

  if (Array.isArray(id)) return id[0] ?? null;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function getAccountPath(id: string | null) {
  return id ? `${accountBasePath}/${id}` : accountBasePath;
}

function selectAccount(id: string) {
  selectedAccount.value = id;
}

function clearSelection() {
  selectedAccount.value = null;
}

function saveAccount(account: BankAccountData) {
  const parsed = bankAccountSchema.safeParse(account);

  if (!parsed.success) {
    console.warn('Unexpected response format for saved account:', parsed.error);
    return;
  }

  const index = accounts.value.findIndex((item) => item._id === parsed.data._id);

  if (index >= 0) {
    accounts.value.splice(index, 1, parsed.data);
  } else {
    accounts.value.push(parsed.data);
  }
}

async function load() {
  loading.value = true;

  try {
    const result = await $userApi<BankAccountData[]>('/accounts');

    if (Array.isArray(result)) {
      accounts.value = result.flatMap((item) => {
        const parsed = bankAccountSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
    } else {
      console.warn('Unexpected response format for accounts:', result);
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    selectedAccount.value = getRouteAccountId();
  },
);

watch(selectedAccount, async (id) => {
  const targetPath = getAccountPath(id);

  if (route.path !== targetPath) {
    await router.push(targetPath);
  }
});

load();
</script>

<template>
  <Teleport to="#ci_cta">
    <button class="btn btn-light" @click="selectAccount('new')">
      <i class="bi bi-plus-lg me-1" /> Adicionar conta
    </button>
  </Teleport>

  <LayoutPage>
    <div class="d-flex align-items-center justify-content-between mt-3">
      <span v-if="accounts.length" class="text-muted ms-3">{{ accounts.length }} contas</span>
    </div>

    <PageLoading v-if="loading">Carregando contas...</PageLoading>

    <div v-else class="list-group bg-white shadow-sm mt-3">
      <button
        v-for="account in accounts"
        :key="account._id ?? account.name"
        type="button"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        @click="account._id && selectAccount(account._id)"
      >
        <span>
          <strong>{{ account.name }}</strong>
          <small class="text-muted d-block">{{ account.brand }}</small>
        </span>
        <MoneyDisplay :money="account.current" />
      </button>
    </div>

    <CanvasAccount
      :id="selectedAccount"
      :account="selectedAccountData"
      @close="clearSelection"
      @saved="saveAccount"
    />
  </LayoutPage>
</template>
