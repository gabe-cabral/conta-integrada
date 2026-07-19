<script setup lang="ts">
import type { AuthCredentialSummary } from '~~/shared/schemas/authCredentials';

import { useAppStore, type UserProfile } from '~/stores/appStore';
import useSystemStore from '~/stores/systemStore';

definePageMeta({
  middleware: ['authenticated'],
  title: 'Perfil',
});

type CredentialView = Omit<
  AuthCredentialSummary,
  'createdAt' | 'lastUsedAt'
> & {
  createdAt: string
  lastUsedAt: string | null
};

const { $userApi } = useNuxtApp() as unknown as { $userApi: typeof $fetch };
const { fetch: refreshSession } = useUserSession();
const appStore = useAppStore();
const systemStore = useSystemStore();
const { userProfile: profile } = storeToRefs(appStore);

const loading = ref(true);
const savingProfile = ref(false);
const loadingDevices = ref(true);
const removingCredentialId = ref<string | null>(null);
const credentials = ref<CredentialView[]>([]);
const name = ref('');

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : 'Ainda não disponível';
}

function deviceTitle(credential: CredentialView): string {
  return credential.browser || credential.os || 'Dispositivo não identificado';
}

function deviceDescription(credential: CredentialView): string {
  return [credential.os, credential.platform].filter(Boolean).join(' · ')
    || 'Detalhes não disponíveis';
}

async function loadProfile() {
  const result = await appStore.getUserProfile();
  name.value = result.name;
}

async function loadCredentials() {
  loadingDevices.value = true;
  try {
    credentials.value = await $userApi<CredentialView[]>('/auth-credentials');
  } finally {
    loadingDevices.value = false;
  }
}

async function saveProfile() {
  if (!profile.value || name.value.trim() === profile.value.name) return;

  savingProfile.value = true;
  try {
    const updatedProfile = await $userApi<UserProfile>('', {
      method: 'PATCH',
      body: { name: name.value },
    });
    appStore.setUserProfile(updatedProfile);
    name.value = updatedProfile.name;
    await refreshSession();
    systemStore.addMessage(
      'Perfil atualizado com sucesso.',
      'Perfil',
      'success',
      'bi-check-circle',
      3,
    );
  } finally {
    savingProfile.value = false;
  }
}

async function removeCredential(credential: CredentialView) {
  if (credential.current || !confirm('Remover esta passkey do seu perfil?')) return;

  removingCredentialId.value = credential.id;
  try {
    await $userApi(`/auth-credentials/${encodeURIComponent(credential.id)}`, {
      method: 'DELETE',
    });
    await loadCredentials();
    systemStore.addMessage(
      'Passkey removida com sucesso.',
      'Segurança',
      'success',
      'bi-shield-check',
      3,
    );
  } finally {
    removingCredentialId.value = null;
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadProfile(), loadCredentials()]);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <LayoutPage>
    <PageLoading v-if="loading">Carregando perfil...</PageLoading>

    <div v-else-if="profile" class="row g-4">
      <div class="col-12 col-xl-7">
        <form class="card h-100" @submit.prevent="saveProfile">
          <div class="card-body">
            <h5 class="card-title">Perfil</h5>
            <p class="card-subtitle mb-4 text-body-secondary">
              Seus dados básicos de identificação.
            </p>

            <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-4 mb-4">
              <UserAvatar
                :src="profile.avatarUrl"
                :name="profile.name"
                :size="96"
                class="border"
              />
              <div>
                <div class="fw-semibold">Foto do perfil</div>
                <div class="text-body-secondary small">
                  Obtida do Gravatar associado ao seu e-mail.
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label for="profileName" class="form-label">Nome completo</label>
              <input
                id="profileName"
                v-model="name"
                type="text"
                minlength="2"
                maxlength="150"
                autocomplete="name"
                class="form-control"
                required
              />
            </div>

            <div>
              <label for="profileEmail" class="form-label">E-mail</label>
              <input
                id="profileEmail"
                :value="profile.email"
                type="email"
                class="form-control"
                readonly
                aria-describedby="profileEmailHelp"
              />
              <div id="profileEmailHelp" class="form-text">
                A alteração de e-mail ainda não está disponível.
              </div>
            </div>
          </div>

          <div class="card-footer text-end">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="savingProfile || name.trim() === profile.name"
            >
              <span
                v-if="savingProfile"
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true"
              />
              Salvar perfil
            </button>
          </div>
        </form>
      </div>

      <div class="col-12 col-xl-5">
        <section class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Conta</h5>
            <p class="card-subtitle mb-4 text-body-secondary">
              Informações e gerenciamento da sua conta.
            </p>

            <dl class="row mb-4">
              <dt class="col-sm-5">Criada em</dt>
              <dd class="col-sm-7">{{ formatDate(profile.createdAt) }}</dd>
              <dt class="col-sm-5">Último acesso</dt>
              <dd class="col-sm-7 mb-0">{{ formatDate(profile.lastAccessAt) }}</dd>
            </dl>

            <hr />
            <button type="button" class="btn btn-outline-danger" disabled>
              Excluir conta
            </button>
            <span class="ms-2 small text-body-secondary">Disponível em breve</span>
          </div>
        </section>
      </div>

      <div class="col-12">
        <section class="card">
          <div class="card-body">
            <h5 class="card-title">Segurança</h5>
            <p class="card-subtitle mb-4 text-body-secondary">
              Método de autenticação e dispositivos cadastrados.
            </p>

            <div class="d-flex align-items-center gap-3 p-3 rounded bg-body-tertiary mb-4">
              <i class="bi bi-key fs-3 text-primary" aria-hidden="true" />
              <div>
                <div class="fw-semibold">Passkey</div>
                <div class="small text-body-secondary">
                  Sua conta usa autenticação sem senha. Este método não pode ser alterado no MVP.
                </div>
              </div>
            </div>

            <h6>Dispositivos</h6>
            <PageLoading v-if="loadingDevices">Carregando dispositivos...</PageLoading>
            <div v-else-if="credentials.length === 0" class="text-body-secondary">
              Nenhuma passkey cadastrada.
            </div>
            <ul v-else class="list-group list-group-flush">
              <li
                v-for="credential in credentials"
                :key="credential.id"
                class="list-group-item px-0 py-3 d-flex flex-column flex-md-row gap-3 align-items-md-center"
              >
                <i class="bi bi-laptop fs-3" aria-hidden="true" />
                <div class="flex-grow-1">
                  <div class="fw-semibold">
                    {{ deviceTitle(credential) }}
                    <span v-if="credential.current" class="badge text-bg-primary ms-1">Atual</span>
                    <span v-if="credential.backedUp" class="badge text-bg-secondary ms-1">
                      Sincronizada
                    </span>
                  </div>
                  <div class="small text-body-secondary">
                    {{ deviceDescription(credential) }}
                  </div>
                  <div class="small text-body-secondary">
                    Último uso: {{ formatDate(credential.lastUsedAt) }}
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="credential.current || removingCredentialId === credential.id"
                  :title="credential.current ? 'O dispositivo atual não pode ser removido' : undefined"
                  @click="removeCredential(credential)"
                >
                  <span
                    v-if="removingCredentialId === credential.id"
                    class="spinner-border spinner-border-sm me-1"
                    aria-hidden="true"
                  />
                  Remover
                </button>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </LayoutPage>
</template>
