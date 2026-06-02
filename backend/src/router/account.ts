import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const accountRouter = router({
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all user accounts
    const accounts = await prisma.account.findMany({
      where: { userId: ctx.user.id },
      orderBy: { id: 'asc' },
    });

    // Fetch all user transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: ctx.user.id },
    });

    // Dynamically aggregate net balance for each account type
    return accounts.map(acc => {
      let balance = 0;
      transactions.forEach(t => {
        if (t.accountId === acc.id) {
          if (t.type === 'INCOME') {
            balance += t.amount;
          } else {
            balance -= t.amount;
          }
        }
      });
      return {
        ...acc,
        balance,
      };
    });
  }),
});
