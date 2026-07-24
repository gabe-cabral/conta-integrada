<script setup lang="ts">
import { useAppStore } from '~/stores/appStore';

const { loggedIn: userIsLogged } = useUserSession();
const { t } = useI18n();
const appStore = useAppStore();

const menuItems = [
  { name: 'Início', link: '/' },
  { name: 'Transações', link: '/transactions' },
  { name: 'Investimentos', link: '/investments' },
  { name: 'Orçamento', link: '/budget' },
];

const userMenuItens = computed(() => [
  { name: 'Espaços', link: '/user/financial-spaces', icon: 'grid-1x2-fill' },
  { name: 'Contas', link: '/user/accounts', icon: 'bank' },
  { name: 'Cartões', link: '/', icon: 'credit-card' },
  { name: t('categories.pageTitle'), link: '/user/categories', icon: 'bookmarks' },
  { separator: true },
  { name: 'Preferências', link: '/user/preferences', icon: 'toggles2' },
]);

watch(userIsLogged, (newVal) => {
  if (!newVal) {
    navigateTo('/login');
  }
});

onMounted(async () => {
  // Carregamos aqui para evitar erro de hidratação do bootstrap no SSR
  const { Dropdown } = await import('bootstrap');

  await nextTick();

  // Initialize Bootstrap dropdowns
  const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
  [...dropdownElementList].map((el) => new Dropdown(el));
});
</script>

<template>
  <header>
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <NuxtLink class="navbar-brand me-4" :to="{ name: 'index' }">
          <img
            src="/logo.svg"
            alt="Conta Integrada"
            height="48"
            class="d-inline-block align-text-top"
          />
        </NuxtLink>

        <AuthState>
          <template #default="{ loggedIn, clear, user }">
            <LayoutSearch :logged-in="loggedIn" class="mx-md-auto my-2 my-md-0" />

            <div v-if="loggedIn" class="dropdown text-end">
              <a
                href="#"
                class="d-flex align-items-center link-body-emphasis text-decoration-none dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <UserAvatar
                  :src="appStore.userProfile?.avatarUrl"
                  :name="appStore.userProfile?.name ?? user?.name"
                  :size="32"
                  class="me-2"
                />
                <span class="d-inline-block text-truncate" style="max-width: 10rem">{{
                  user?.name?.split(' ')?.at(0)
                }}</span>
              </a>

              <ul class="dropdown-menu dropdown-menu-end text-small" style="">
                <li
                  v-for="menu in userMenuItens"
                  :key="menu.link"
                  :class="{ 'dropdown-item': !menu.separator }"
                >
                  <hr v-if="menu.separator" class="dropdown-divider" />
                  <NuxtLink
                    v-else
                    class="nav-link active"
                    aria-current="page"
                    :to="menu.link"
                    exact-active-class="active"
                  >
                    <i v-if="menu.icon" class="bi me-2" :class="[`bi-${menu.icon}`]" />
                    {{ menu.name }}
                  </NuxtLink>
                </li>
                <li>
                  <hr class="dropdown-divider" />
                </li>
                <li>
                  <NuxtLink class="dropdown-item" to="/user/profile">
                    <i class="bi bi-person me-2" />
                    Perfil
                  </NuxtLink>
                </li>
                <li>
                  <button type="button" class="dropdown-item text-danger fw-bold" @click="clear">
                    <i class="bi bi-box-arrow-right me-2" /> Sair
                  </button>
                </li>
              </ul>
            </div>

            <NuxtLink v-else-if="!$route.path.startsWith('/login')" to="/login" class="btn btn-primary ms-auto">
              Entrar
            </NuxtLink>
          </template>
        </AuthState>
      </div>
    </nav>

    <nav class="navbar navbar-expand-lg bg-alternative py-3" data-bs-theme="dark">
      <div class="container justify-content-between">
        <div class="navbar-brand text-uppercase">{{ $route.meta.title }}</div>

        <AuthState>
          <template #default="{ loggedIn }">
            <div v-if="loggedIn" class="mx-auto">
              <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li v-for="menu in menuItems" :key="menu.link" class="nav-item">
                  <NuxtLink
                    class="nav-link active"
                    aria-current="page"
                    :to="menu.link"
                    exact-active-class="active"
                  >
                    {{ menu.name }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
            <div id="ci_cta" />
          </template>

          <template #placeholder>
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Verificando sessão...</span>
            </div>
          </template>
        </AuthState>
      </div>
    </nav>
  </header>
</template>
