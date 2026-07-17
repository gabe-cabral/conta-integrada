export default defineNitroPlugin(() => {
  // Called when the session is fetched during SSR for the Vue composable (/api/_auth/session)
  // Or when we call useUserSession().fetch()
  sessionHooks.hook('fetch', async (_session, _event) => {
    console.log('Session is being fetched');
    // extend User Session by calling your database
    // or
    // throw createError({ ... }) if session is invalid for example
  });

  // Called when we call useUserSession().clear() or clearUserSession(event)
  sessionHooks.hook('clear', async (_session, _event) => {
    console.log('Session is being cleared');
    // Log that user logged out
  });
});
