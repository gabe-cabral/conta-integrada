import 'mongodb-client-encryption';

import { setup as setupExchangeRateSnapshots } from './collections/exchange_rate_snapshots.ts';
import { setup as setupFinancialInstitutions } from './collections/financial_institutions.ts';
import { setup as setupAuthCredentials } from './collections/auth_credentials.ts';
import { setup as setupFinancialSpaces } from './collections/financial-spaces.ts';
import { setup as setupUserPreferences } from './collections/user_preferences.ts';
import { setup as setupAuthChallenges } from './collections/auth_challenges.ts';
import { setup as setupAuthSessions } from './collections/auth_sessions.ts';
import { setup as setupTransactions } from './collections/transactions.ts';
import { setup as setupCategories } from './collections/categories.ts';
import { setup as setupCurrency } from './collections/currency.ts';
import { setup as setupUser } from './collections/users.ts';
import { closeDatabaseClients } from './client.ts';

async function main() {
  await setupUser();
  await setupAuthCredentials();
  await setupAuthSessions();
  await setupAuthChallenges();
  await setupCategories();
  await setupTransactions();
  await setupFinancialInstitutions();
  await setupCurrency();
  await setupUserPreferences();
  await setupExchangeRateSnapshots();
  await setupFinancialSpaces();
}

main()
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exitCode = 1;
  })
  .finally(closeDatabaseClients);
