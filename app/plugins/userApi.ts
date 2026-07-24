import useSystemStore from '~/stores/systemStore';

export default defineNuxtPlugin((nuxtApp) => {
  const { session } = useUserSession();
  const requestHeaders = import.meta.server
    ? useRequestHeaders(['cookie'])
    : {};

  const userApi = $fetch.create({
    baseURL: '/api',

    onRequest({ options, error }) {
      if (!session.value?.user) throw new Error('User not found in session');

      if (requestHeaders.cookie) {
        options.headers.set('cookie', requestHeaders.cookie);
      }
      options.headers.set('X-Correlation-ID', crypto.randomUUID());
      options.headers.set('X-User-ID', session.value.user.id);
      options.baseURL += '/users/' + session.value.user.id;

      if (error) console.error('API Request Error:', error);
    },

    async onResponseError({ response, error }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => {
          const systemStore = useSystemStore();
          navigateTo('/login');

          systemStore.addMessage(
            'Sua sessão expirou. Por favor, faça login novamente.',
            'Sessão Expirada',
            'warning',
            'bi-exclamation-triangle-fill',
            5,
          );
        });
      } else {
        await nuxtApp.runWithContext(() => {
          const systemStore = useSystemStore();
          console.warn('API Response Error:', error);
          systemStore.addMessage(
            `Erro ${response.status}: ${error?.message || 'Ocorreu um erro ao processar sua solicitação.'}`,
            error?.name || 'Erro de API',
            'danger',
            'bi-bug-fill',
            5,
          );
        });
      }
    },

    async onResponse({ request, response }) {
      console.log('[fetch response]', request, response.status);
    },
  });

  // Expose to useNuxtApp().$userApi
  return {
    provide: {
      userApi,
    },
  };
});
