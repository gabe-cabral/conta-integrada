<script setup lang="ts">
import { useUserTransactions } from '~/api/transactions';

definePageMeta({
  middleware: ['authenticated'],
});

const loading = ref(true);
const selectedTx = ref<string | null>(null);
const transactions = ref<Transaction[]>([]);

async function load() {
  loading.value = true;

  try {
    const { user } = useUserSession();

    if (!user || !user.value?.id) throw new Error('User not found in session');

    transactions.value = await useUserTransactions(user.value.id, {
      dateStart: '2026-01-01T00:00:00Z',
    });
  } finally {
    loading.value = false;
  }
}

const groupedTransactions = computed(() => {
  const map = transactions.value.reduce((acc: Map<string, Transaction[]>, tx) => {
    const d = tx.date.toISOString().slice(0, 10);
    const items = acc.get(d) ?? [];
    items.push(tx);
    acc.set(d, items);
    return acc;
  }, new Map<string, Transaction[]>());

  return [...map.keys()]
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((date) => ({ date, items: map.get(date) ?? [] }));
});

load();
</script>

<template>
  <LayoutPage>
    <div class="d-flex align-items-center">
      <h4 class="text-uppercase font-monospace text-muted">Transações</h4>
      <span class="text-muted ms-auto me-4">{{ transactions.length }} transações</span>
      <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
        <div class="btn-group me-2" role="group" aria-label="Second group">
          <button type="button" class="btn btn-outline-alternative" @click="selectedTx = 'new'">
            <i class="bi bi-dash-lg" />
          </button>
          <button type="button" class="btn btn-outline-alternative">
            <i class="bi bi-plus-lg" />
          </button>
          <button type="button" class="btn btn-outline-alternative">
            <i class="bi bi-shuffle" />
          </button>
          <button type="button" class="btn btn-outline-alternative">
            <i class="bi bi-funnel-fill" />
          </button>
          <button type="button" class="btn btn-outline-alternative" title="Importar transações">
            <i class="bi bi-upload" />
          </button>
        </div>
        <div class="btn-group dropdown" role="group" aria-label="Third group">
          <button type="button" class="btn btn-outline-alternative">
            <i class="bi bi-chevron-left" />
          </button>
          <PeriodPicker />
          <button type="button" class="btn btn-outline-alternative">
            <i class="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </div>

    <div v-for="tx in groupedTransactions" :key="tx.date" class="mt-4">
      <h5 class="mb-3">
        {{ new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'long' }) }}
      </h5>
      <div class="list-group bg-white shadow-sm">
        <div
          v-for="item in tx.items"
          :key="item._id"
          class="list-group-item d-flex justify-content-between align-items-center bg-transparent border border-2 border-top-0 border-end-0 border-bottom-0"
          :class="{
            'border-danger':
              item.status !== 'CONFIRMED' &&
              item.date.getTime() < Date.now() &&
              item.amount.amountInCents < 0,
            'border-warning':
              item.status !== 'CONFIRMED' &&
              item.date.getTime() < Date.now() &&
              item.amount.amountInCents > 0,
            'border-success': item.status === 'CONFIRMED',
          }"
        >
          <div>
            <h6 class="mb-1">{{ item.description }}</h6>
            <small class="text-muted">{{ relativeTimeHelper(item.date) }}</small>
          </div>
          <span :class="item.amount.amountInCents < 0 ? 'text-danger' : 'text-success'">
            {{
              new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BRL' }).format(
                item.amount.amountInCents / 100,
              )
            }}
          </span>
        </div>
      </div>
    </div>
    <CanvasTransaction v-if="selectedTx" :id="selectedTx" @close="selectedTx = null" />
  </LayoutPage>
</template>
