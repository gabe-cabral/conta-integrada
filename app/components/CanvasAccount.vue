<script setup lang="ts">
import { bankAccountCreateSchema } from '~~/shared/schemas/bankAccounts.js';

import type {
  BankAccount,
  BankAccountCreateData,
  BankAccountData,
} from '~~/shared/schemas/bankAccounts.js';

import useSystemStore from '~/stores/systemStore';
import { useAppStore } from '~/stores/appStore';

interface AccountForm extends Omit<BankAccount, '_id' | 'createdAt' | 'userId'> {
  _id: string | null;
  createdAt?: Date;
  userId?: string;
}

const emits = defineEmits<{
  close: [];
  saved: [account: BankAccountData];
}>();

const props = withDefaults(
  defineProps<{
    account?: BankAccount | null;
    id?: string | null;
  }>(),
  {
    id: null,
    account: null,
  },
);

const appStore = useAppStore();
const systemStore = useSystemStore();
const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };

const loading = ref(false);
const sending = ref(false);
const validated = ref(false);
const accountForm = ref<AccountForm | null>(null);
const formCurrentAmount = ref(0);
const formIncomeAmount = ref(0);
const formExpensesAmount = ref(0);

const accountTypes = [
  { value: 'CHECKING', label: 'Conta corrente' },
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'INVESTMENT', label: 'Investimento' },
  { value: 'LOAN', label: 'Emprestimo' },
  { value: 'OTHER', label: 'Outro' },
  { value: 'SAVINGS', label: 'Poupanca' },
  { value: 'WALLET', label: 'Carteira' },
] as const;

const submitLabel = computed(() => (props.id === 'new' ? 'Criar conta' : 'Salvar alteracoes'));

function getCurrencySymbol(code: string) {
  const currency = appStore.currencies.find((c) => c.code === code);
  return currency ? currency.symbol : code;
}

function closePanel() {
  accountForm.value = null;
  emits('close');
}

function setMoneyRefs(source: AccountForm) {
  formCurrentAmount.value = source.current.amountInCents / 100;
  formIncomeAmount.value = source.income.amountInCents / 100;
  formExpensesAmount.value = source.expenses.amountInCents / 100;
}

function createNew() {
  const newAccount: AccountForm = {
    _id: null,
    brand: '',
    current: {
      amountInCents: 0,
      currency: systemStore.defaultCurrency,
    },
    name: '',
    type: 'CHECKING',
    expenses: {
      amountInCents: 0,
      currency: systemStore.defaultCurrency,
    },
    income: {
      amountInCents: 0,
      currency: systemStore.defaultCurrency,
    },
    number: '',
    updatedAt: null,
  };

  accountForm.value = newAccount;
  setMoneyRefs(newAccount);
}

function loadFromProp(source: BankAccount) {
  const loadedAccount: AccountForm = {
    ...source,
    _id: source._id ?? null,
    number: source.number ?? '',
  };

  accountForm.value = loadedAccount;
  setMoneyRefs(loadedAccount);
}

function syncAccount() {
  if (!props.id) {
    accountForm.value = null;
    return;
  }

  if (props.id === 'new') {
    createNew();
    return;
  }

  if (props.account) {
    loadFromProp(props.account);
  } else {
    account.value = null;
  }
}

async function submit() {
  validated.value = true;

  if (!accountForm.value) return;
  if (accountForm.value._id) return;

  sending.value = true;
  accountForm.value.current.amountInCents = Math.round(formCurrentAmount.value * 100);
  accountForm.value.income.amountInCents = Math.round(formIncomeAmount.value * 100);
  accountForm.value.expenses.amountInCents = Math.round(formExpensesAmount.value * 100);

  try {
    const payload: BankAccountCreateData = {
      type: accountForm.value.type,
      name: accountForm.value.name,
      brand: accountForm.value.brand,
      number: accountForm.value.number || undefined,
      current: accountForm.value.current,
      income: accountForm.value.income,
      expenses: accountForm.value.expenses,
    };
    const body = bankAccountCreateSchema.parse(payload);
    const saved = await $userApi<BankAccountData>('/accounts', { method: 'POST', body });

    emits('saved', saved);
    closePanel();
  } finally {
    sending.value = false;
  }
}

watch(() => [props.account, props.id] as const, syncAccount, { immediate: true });
</script>

<template>
  <BaseCanvas
    :id="props.id"
    kind="account"
    title="conta"
    :loading="loading"
    :sending="sending"
    :validated="validated"
    loading-label="Obtendo conta..."
    :submit-label="submitLabel"
    @close="closePanel"
    @submit="submit"
  >
    <template v-if="accountForm">
      <p v-if="accountForm.updatedAt">
        <small class="text-muted fst-italic">
          Alterado ultima vez {{ relativeTimeHelper(accountForm.updatedAt) }}<br />
          <RouterLink :to="{ name: 'parameter-history', params: { id: props.id } }">
            <i class="bi bi-clock-history" /> ver historico
          </RouterLink>
        </small>
      </p>

      <div class="mb-3">
        <label for="account_name" class="form-label">Nome</label>
        <input
          id="account_name"
          v-model="accountForm.name"
          type="text"
          class="form-control"
          required
          minlength="3"
          maxlength="100"
        />
      </div>

      <div class="mb-3">
        <label for="account_brand" class="form-label">Instituicao</label>
        <input
          id="account_brand"
          v-model="accountForm.brand"
          type="text"
          class="form-control"
          required
          maxlength="100"
        />
      </div>

      <div class="mb-3">
        <label for="account_type" class="form-label">Tipo</label>
        <select id="account_type" v-model="accountForm.type" class="form-select" required>
          <option v-for="type in accountTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label for="account_number" class="form-label">Numero</label>
        <input
          id="account_number"
          v-model="accountForm.number"
          type="text"
          class="form-control"
          maxlength="100"
        />
      </div>

      <div class="mb-3">
        <label for="account_current" class="form-label">Saldo atual</label>
        <div class="input-group">
          <span class="input-group-text">{{
            getCurrencySymbol(accountForm.current.currency)
          }}</span>
          <input
            id="account_current"
            v-model="formCurrentAmount"
            type="number"
            class="form-control"
            step="0.01"
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="account_income" class="form-label">Receitas</label>
        <div class="input-group">
          <span class="input-group-text">{{ getCurrencySymbol(accountForm.income.currency) }}</span>
          <input
            id="account_income"
            v-model="formIncomeAmount"
            type="number"
            class="form-control"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="account_expenses" class="form-label">Despesas</label>
        <div class="input-group">
          <span class="input-group-text">{{
            getCurrencySymbol(accountForm.expenses.currency)
          }}</span>
          <input
            id="account_expenses"
            v-model="formExpensesAmount"
            type="number"
            class="form-control"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </template>

    <p v-else class="text-muted mb-0">Conta nao encontrada.</p>
  </BaseCanvas>
</template>
