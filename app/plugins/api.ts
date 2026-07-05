import useSystemStore from "~/stores/systemStore"

export default defineNuxtPlugin((nuxtApp) => {
  const { session } = useUserSession()

  const api = $fetch.create({
    baseURL: 'http://localhost:3000/api',

    onRequest({ request, options, error }) {
      options.headers.set('X-Correlation-ID', crypto.randomUUID())
      options.headers.set('X-User-ID', session.value?.user?.id || 'guest')

      if (error) console.error('API Request Error:', error)
    },

    async onResponseError({ response, error }) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => {
          const systemStore = useSystemStore()
          navigateTo('/login')

          systemStore.addMessage(
            'Sua sessão expirou. Por favor, faça login novamente.',
            'Sessão Expirada',
            'warning', 
            'bi-exclamation-triangle-fill', 
            5)
        })
      } else {
        await nuxtApp.runWithContext(() => {
          const systemStore = useSystemStore()
          console.warn('API Response Error:', error)
          systemStore.addMessage(
            `Erro ${response.status}: ${error?.message || 'Ocorreu um erro ao processar sua solicitação.'}`,
            error?.name || 'Erro de API',
            'danger',
            'bi-bug-fill',
            5
          )
        })
      }
    },

    async onResponse({ request, response, options }) {
      console.log("[fetch response]", request, response.status);
    },
  })

  // Expose to useNuxtApp().$api
  return {
    provide: {
      api,
    },
  }
})
