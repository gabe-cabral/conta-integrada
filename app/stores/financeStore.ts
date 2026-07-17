export const useFinanceStore = defineStore('financeStore', {
  state: () => ({
    balances: [] as Balance[],
    cards: [] as Card[],
    accounts: [] as BankAccount[],
    lastUpdated: null as Date | null,
  }),

  actions: {
    async fetchBalances() {
      try {
        // Simulate an API call to fetch balance data
        this.lastUpdated = new Date();
        this.balances = [
          {
            income: { amountInCents: 0, currency: 'EUR' },
            expenses: { amountInCents: 0, currency: 'EUR' },
            currentBalance: { amountInCents: 10000, currency: 'EUR' },
            projectedBalance: { amountInCents: 10400, currency: 'EUR' },
            currency: 'EUR',
            essentialExpenses: null,
            otherExpenses: null,
            investments: {
              amountInCents: 400,
              currency: 'EUR',
              percentage: 0.4,
            },
          },
          {
            income: { amountInCents: 1800000, currency: 'BRL' },
            expenses: { amountInCents: 1200000, currency: 'BRL' },
            currentBalance: { amountInCents: 250000, currency: 'BRL' },
            projectedBalance: { amountInCents: 1712800, currency: 'BRL' },
            currency: 'BRL',
            essentialExpenses: {
              amountInCents: 850000,
              currency: 'BRL',
              percentage: 0.26,
            },
            otherExpenses: {
              amountInCents: 100000,
              currency: 'BRL',
              percentage: 0.3,
            },
            investments: {
              amountInCents: 50000,
              currency: 'BRL',
              percentage: 0.3,
            },
          },
          {
            income: { amountInCents: 500000, currency: 'USD' },
            expenses: { amountInCents: 1000, currency: 'USD' },
            currentBalance: { amountInCents: 499000, currency: 'USD' },
            projectedBalance: { amountInCents: 510800, currency: 'USD' },
            currency: 'USD',
            essentialExpenses: null,
            otherExpenses: null,
            investments: {
              amountInCents: -309,
              currency: 'USD',
              percentage: -0.05,
            },
          },
        ];

        this.cards = [
          {
            brand: 'mastercard',
            number: '9070',
            current: {
              amountInCents: 1037059,
              currency: 'BRL',
              percentage: 0.3,
            },
            invoiceDate: new Date(2026, 0, 30),
          },
          {
            brand: 'visa',
            number: '1234',
            current: {
              amountInCents: 1803010051,
              currency: 'COP',
              percentage: 0.01,
            },
            invoiceDate: new Date(2026, 0, 25),
          },
        ];

        this.accounts = [
          {
            brand: 'santander',
            number: '5678',
            current: {
              amountInCents: 1500000,
              currency: 'BRL',
              percentage: 0.9,
            },
            income: { amountInCents: 300000, currency: 'BRL' },
            expenses: { amountInCents: 120000, currency: 'BRL' },
          },
        ];
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    },
  },
});
