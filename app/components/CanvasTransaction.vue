<script setup lang="ts">
import type { Transaction } from '#shared/types/transactions';
import type { Account } from '~~/shared/types/resources';
import type { Offcanvas } from 'bootstrap';

import useSystemStore from '~/stores/systemStore';
import { useAppStore } from '~/stores/appStore';

let offcanvasElement: HTMLElement | null;
let offcanvas: Offcanvas | undefined;

interface TransactionForm extends Omit<
  Transaction,
  '_id' | 'date' | 'sourceId' | 'createdAt' | 'userId'
> {
  _id: string | null;
  date: Date | null;
  sourceId: string | null;
}

const { $userApi } = useNuxtApp();
const router = useRouter();

const emits = defineEmits(['close']);

const props = defineProps({
  id: {
    type: String,
    required: false,
    default: 'new',
  },
});

const appStore = useAppStore();
const systemStore = useSystemStore();

const loading = ref(false);
const sending = ref(false);
const validated = ref(false);
const transaction = ref<TransactionForm>();
const txTypes = ref<TransactionTypeDisplay[]>(appStore.transactionTypes);
const accounts = ref<Partial<Account>[]>([
  { _id: '68c83604e8af579df8775474', name: 'Santander', type: 'CHECKING' },
  { _id: '68d0abe1e8af579df877a543', name: 'Inter', type: 'CHECKING' },
]);

const formAmount = ref<number | null>(null);
const formSource = ref<Account | null>(null);
const formDestination = ref<Account | null>(null);

const canEdit = computed(() => !transaction.value?.conciliationId);
const typeGroups = computed(() => {
  return {
    main: txTypes.value.slice(0, 3),
    other: txTypes.value.slice(3),
  };
});

function getCurrencySymbol(code: string) {
  const currency = appStore.currencies.find((c) => c.code === code);
  return currency ? currency.symbol : code;
}

const categories = computed(() => {
  return appStore.categories.filter((c) => !c.parentId && c.kind === transaction.value?.type);
});

function getSubcategories(parentId: string) {
  return appStore.categories.filter(
    (c) => c.parentId === parentId && c.kind === transaction.value?.type,
  );
}

function setTransactionType(type: string, idx: number) {
  if (transaction.value) {
    transaction.value.type = type as Transaction['type'];
  }

  if (idx > 2) {
    // Move to main types
    const movedType = txTypes.value.splice(idx, 1)[0];
    txTypes.value.unshift(movedType!);
  }
}

function closePanel() {
  offcanvas?.hide();
  emits('close');
}

async function getTransaction(id: string) {
  loading.value = true;

  const result = await consoleApi.getTransaction(id);

  if (result.ok) {
    transaction.value = result.data;
  } else {
    systemStore.addResultErrorMessage(result, 'Ocorreu erro ao carregar a transação');
  }

  loading.value = false;
}

async function submit() {
  sending.value = true;
  validated.value = true;

  if (!transaction.value) {
    return;
  }

  const verbPrefix = props.id === 'new' ? 'adiciona' : 'edita';

  if (props.id === 'new') {
    transaction.value._id = null;
  }

  try {
    const result = await $userApi<Transaction>('/transactions', {
      method: props.id === 'new' ? 'PUT' : 'PATCH',
      body: {
        ...transaction.value,
        datePrecision: 'DATE',
        amount: {
          amountInCents: formAmount.value ? Math.round(formAmount.value * 100) : 0,
          currency: transaction.value.amount.currency,
        },
        sourceId: formSource.value ? formSource.value._id || null : null,
        sourceType: formSource.value ? (formSource.value.type as Account['type']) : undefined,
        destinationId: formDestination.value ? formDestination.value._id || null : null,
        destinationType: formDestination.value
          ? (formDestination.value.type as Account['type'])
          : undefined,
      } as Transaction,
    });

    systemStore.addMessage(
      `Transação ${result.description} ${verbPrefix}da com sucesso!`,
      'Sucesso',
      'success',
      'bi-check2-circle',
      3,
    );

    // Volta para a lista
    closePanel();
  } catch (error) {
    systemStore.addResultErrorMessage(error, `Não foi possível ${verbPrefix}r a transação.`);
    sending.value = false;
  }
}

watch(
  () => props.id,
  (newValue) => {
    if (!offcanvas) return;

    if (newValue) {
      offcanvas.show();
      getTransaction(newValue);
    } else {
      closePanel();
    }
  },
);

onMounted(async () => {
  const { Offcanvas } = await import('bootstrap');

  offcanvasElement = document.getElementById('transactionForm');

  if (offcanvasElement) {
    offcanvas = new Offcanvas(offcanvasElement);

    if (props.id) {
      offcanvas.show();

      if (props.id === 'new') {
        transaction.value = {
          _id: '',
          description: '',
          amount: { amountInCents: 0, currency: 'BRL' },
          attachmentsCount: 0,
          date: appStore.lastInputDate,
          type: 'EXPENSE',
          status: 'PENDING',
          categoryId: appStore.lastInputCategoryId,
          sourceId: appStore.lastInputSourceId,
        };
      } else {
        getTransaction(props.id);
      }
    }

    if (router) offcanvasElement.addEventListener('hide.bs.offcanvas', router.back);
  }
});

onUnmounted(() => {
  if (router) offcanvasElement?.removeEventListener('hide.bs.offcanvas', router.back);
  closePanel();
});
</script>

<template>
  <Teleport to="body">
    <div
      id="transactionForm"
      class="offcanvas offcanvas-end"
      tabindex="-1"
      aria-labelledby="transactionFormLabel"
    >
      <div class="offcanvas-header">
        <h5 id="transactionFormLabel" class="offcanvas-title text-capitalize">
          {{ props.id === 'new' ? 'Novo' : props.id.split('.').at(-1) }}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar" />
      </div>
      <div class="offcanvas-body">
        <div v-if="loading" class="d-flex align-items-center mt-4">
          <div class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          <strong role="status">Obtendo transação...</strong>
        </div>

        <form
          v-if="transaction"
          class="needs-validation"
          :class="{ 'was-validated': validated }"
          novalidate
          data-testid="tx-expense-form"
          @submit.prevent="submit"
        >
          <p v-if="transaction.updatedAt">
            <small class="text-muted fst-italic">
              Alterado última vez {{ relativeTimeHelper(transaction.updatedAt) }}<br />
              <RouterLink :to="{ name: 'parameter-history', params: { id: props.id } }">
                <i class="bi bi-clock-history" /> ver histórico
              </RouterLink>
            </small>
          </p>

          <div class="btn-group w-100 mb-3" role="group" aria-label="Tipo da transação">
            <template v-for="txType in typeGroups.main" :key="txType.code">
              <input
                :id="`type_${txType.code}`"
                v-model="transaction.type"
                :value="txType.code"
                type="radio"
                class="btn-check"
                name="tx_type"
                autocomplete="off"
                :readonly="!canEdit"
              />
              <label class="btn btn-outline-primary" :for="`type_${txType.code}`">{{
                txType.label
              }}</label>
            </template>

            <div v-if="txTypes.length > 3" class="btn-group" role="group">
              <button
                type="button"
                class="btn btn-outline-primary dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              />
              <ul class="dropdown-menu">
                <li>
                  <button
                    v-for="(txType, idx) in typeGroups.other"
                    :key="txType.code"
                    type="button"
                    class="dropdown-item"
                    @click="setTransactionType(txType.code, idx + 3)"
                  >
                    {{ txType.label }}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="form-check form-switch mb-3">
            <input
              id="status"
              v-model="transaction.status"
              class="form-check-input"
              type="checkbox"
              true-value="CONFIRMED"
              false-value="PENDING"
              switch
              :readonly="!canEdit"
            />
            <label class="form-check-label" for="status"> Efetivado </label>
          </div>

          <div class="mb-3">
            <label for="tx_desc" class="form-label">Descrição</label>
            <input
              id="tx_desc"
              v-model="transaction.description"
              type="text"
              class="form-control"
              :readonly="!canEdit"
              :required="canEdit"
            />
          </div>

          <div class="mb-3">
            <label for="tx_date" class="form-label">Data</label>
            <input
              id="tx_date"
              v-model="transaction.date"
              type="date"
              class="form-control"
              :readonly="!canEdit"
              :required="canEdit"
            />
          </div>

          <div class="mb-3">
            <label for="tx_amount" class="form-label">Valor</label>
            <div class="input-group mb-3">
              <input type="hidden" name="tx_currency" :value="transaction.amount.currency" />
              <button
                class="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {{ getCurrencySymbol(transaction.amount.currency) }}
              </button>
              <div
                class="dropdown-menu"
                aria-labelledby="dropdownMenuButton"
                style="width: max-content"
              >
                <table class="table table-sm table-hover table-borderless mb-0">
                  <tbody>
                    <tr
                      v-for="currency in appStore.currencies"
                      :key="currency.code"
                      style="cursor: pointer"
                      @click="transaction.amount.currency = currency.code"
                    >
                      <th class="px-3">{{ currency.symbol }}</th>
                      <td>{{ currency.label }}</td>
                      <td class="px-3">{{ currency.code }}</td>
                    </tr>
                  </tbody>
                </table>
                <!-- Table ends here -->
              </div>
              <input
                id="tx_amount"
                v-model="formAmount"
                type="number"
                class="form-control"
                min="0"
                step="0.01"
                :readonly="!canEdit"
                :required="canEdit"
              />
            </div>
          </div>

          <div v-if="transaction.type !== 'TRANSFER'" class="mb-3">
            <label for="tx_category" class="form-label">Categoria</label>
            <select
              id="tx_category"
              v-model="transaction.categoryId"
              class="form-select"
              aria-label="Categoria"
              :disabled="!canEdit"
              :required="canEdit"
            >
              <option value="">Selecione...</option>
              <optgroup v-for="group in categories" :key="group._id" :label="group.name">
                <option
                  v-for="subcategory in getSubcategories(group._id)"
                  :key="subcategory._id"
                  :value="subcategory._id"
                >
                  {{ subcategory.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="mb-3">
            <label for="tx_source" class="form-label">
              {{ transaction.type === 'TRANSFER' ? 'Conta de origem' : 'Conta ou cartão' }}
            </label>
            <select
              id="tx_source"
              v-model="formSource"
              class="form-select"
              aria-label="Conta ou cartão"
              :disabled="!canEdit"
              :required="canEdit"
            >
              <option value="">Selecione...</option>
              <optgroup
                v-for="account in accounts.filter((a) => a.type === 'CHECKING')"
                :key="account._id"
                label="Conta Corrente"
              >
                <option :value="account">{{ account.name }}</option>
              </optgroup>
            </select>
          </div>

          <div v-if="transaction.type === 'TRANSFER'" class="mb-3">
            <label for="tx_source" class="form-label">Conta destino</label>
            <select
              id="tx_source"
              v-model="formDestination"
              class="form-select"
              aria-label="Conta destino"
              :disabled="!canEdit"
              :required="canEdit"
            >
              <option value="">Selecione...</option>
              <optgroup
                v-for="account in accounts.filter((a) => a.type === 'CHECKING')"
                :key="account._id"
                label="Conta Corrente"
              >
                <option :value="account">{{ account.name }}</option>
              </optgroup>
            </select>
          </div>

          <div class="form-check mb-3">
            <input
              id="tx_recurrence"
              v-model="transaction.recurrence"
              class="form-check-input"
              type="checkbox"
              :disabled="!canEdit"
            />
            <label class="form-check-label" for="tx_recurrence">
              Recorrente
              <i
                class="bi bi-info-circle ms-1"
                title="Se marcado, essa transação será repetida automaticamente conforme a periodicidade definida."
              />
            </label>
          </div>

          <button type="submit" class="btn btn-primary mt-4" :disabled="sending">
            <i class="bi bi-floppy2-fill me-2" />{{
              props.id === 'new' ? 'Criar débito' : 'Salvar alterações'
            }}
          </button>
        </form>

        <p v-else class="text-danger">Ocorreu um erro para carregar os dados da transação.</p>
      </div>
    </div>
  </Teleport>

  <RouterView />
</template>
