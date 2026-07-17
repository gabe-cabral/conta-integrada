<script setup lang="ts">
const { register, authenticate } = useWebAuthn({
  registerEndpoint: '/api/webauthn/register', // Default
  authenticateEndpoint: '/api/webauthn/authenticate', // Default
});

const { fetch: fetchUserSession, loggedIn } = useUserSession();

const userName = ref('');
const signingUp = ref(false);
const checking = ref(false);

async function submit() {
  checking.value = true;

  if (signingUp.value) {
    await register({ userName: userName.value }).then(fetchUserSession); // refetch the user session
    return;
  }

  await authenticate(userName.value).then(fetchUserSession); // refetch the user session

  checking.value = false;
}

watch(loggedIn, (newVal) => {
  if (newVal) {
    navigateTo('/');
  }
});
</script>

<template>
  <LayoutPage class="text-center d-flex flex-column align-items-center justify-content-center">
    <h2 class="mb-4">Acesso</h2>
    <form class="w-100" style="max-width: 30rem" @submit.prevent="submit">
      <div class="mb-3">
        <label for="username" class="form-label">E-mail</label>
        <input
          id="username"
          v-model="userName"
          type="email"
          class="form-control"
          autocomplete="email"
        />
      </div>
      <button type="submit" class="btn btn-primary mt-4 w-100" :disabled="checking">
        <span v-if="checking" class="spinner-border spinner-border-sm" aria-hidden="true" />
        {{ signingUp ? 'Registrar' : 'Entrar' }}
      </button>
    </form>
  </LayoutPage>
</template>
