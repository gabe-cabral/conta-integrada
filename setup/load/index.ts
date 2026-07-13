import { load as loadUsers } from './load-users.ts';
import { load as loadCategories } from './load-categories.ts';
import { load as loadTransactions } from './load-transactions.ts';
import { load as loadCurrencies } from './load-currencies.ts';

async function main() {
  await loadCurrencies();

  // const userId = await loadUsers();

  // if (userId) {
  //   // await loadCategories(userId);
  //   await loadTransactions(userId);
  // }
}

main();
