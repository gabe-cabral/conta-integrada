import 'mongodb-client-encryption';
import { setup as setupUser } from './collections/users.ts';
import { setup as setupCategories } from './collections/categories.ts';
import { setup as setupTransactions } from './collections/transactions.ts';
// import { setup as setupPersonDocuments } from './collections/person_documents.ts';
import { setup as setupFinancialInstitutions } from './collections/financial_institutions.ts';
import { setup as setupCurrency } from './collections/currency.ts';

async function main() {
  // await setupUser();

  // await setupCategories();
  // await setupTransactions();
  // await setupPersonDocuments();
  // await setupFinancialInstitutions();
  await setupCurrency();
}

main();
