export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession();

  // redirect the user to the login screen if they're not authenticated
  if (!loggedIn.value) {
    return navigateTo('/login');
  }

  try {
    const appStore = useAppStore();
    appStore.setLastInputDate(null);
    appStore.setLastInputCategoryId(null);
    appStore.setLastInputSourceId(null);

    await Promise.all([
      appStore.getUserPreferences(),
      appStore.getUserProfile(),
    ]);
    await callOnce('categories', () => appStore.getCategories());
  } catch (error) {
    console.error('Error in authenticated middleware:', error);
  }
});
