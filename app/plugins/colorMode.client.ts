import { useColorMode } from '~/composables/useColorMode';

export default defineNuxtPlugin(() => {
  useColorMode().applyStoredPreference();
});
