import { load as loadUserPreferences } from './load-user_preferences.ts';
import { load as loadUserCategories } from './load-user-categories.ts';
// import { load as loadTransactions } from './load-transactions.ts';
import { load as loadCategories } from './load-categories.ts';
import { load as loadCurrencies } from './load-currencies.ts';
import { closeDatabaseClients } from '../database/client.ts';
import { load as loadUsers } from './load-users.ts';

async function main() {
  // Load domains
  await loadCurrencies();
  await loadCategories();

  // Create admin user and load user-specific data
  const userId = await loadUsers();

  if (userId) {
    await loadUserCategories(userId);
    await loadUserPreferences(userId);
    //   await loadTransactions(userId);
  }
}

main()
  .catch((error) => {
    console.error('Database load failed:', error);
    process.exitCode = 1;
  })
  .finally(closeDatabaseClients);
