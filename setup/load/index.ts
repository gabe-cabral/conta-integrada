import { load as loadUserPreferences } from './load-user_preferences.ts';
// import { load as loadTransactions } from './load-transactions.ts';
import { load as loadCategories } from './load-categories.ts';
import { load as loadCurrencies } from './load-currencies.ts';
import { load as loadUsers } from './load-users.ts';

async function main() {
  // Load domains
  await loadCurrencies();

  // Create admin user and load user-specific data
  const userId = await loadUsers();

  if (userId) {
    await loadUserPreferences(userId);
    await loadCategories(userId);
    //   await loadTransactions(userId);
  }
}

main();
