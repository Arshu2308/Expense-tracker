import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { transactionRouter } from './transaction.js';
import { budgetRouter } from './budget.js';
import { recurringRouter } from './recurring.js';
import { accountRouter } from './account.js';
import { insightsRouter } from './insights.js';
import { goalsRouter } from './goals.js';
import { remindersRouter } from './reminders.js';

export const appRouter = router({
  auth: authRouter,
  transaction: transactionRouter,
  budget: budgetRouter,
  recurring: recurringRouter,
  account: accountRouter,
  insights: insightsRouter,
  goals: goalsRouter,
  reminders: remindersRouter,
});

export type AppRouter = typeof appRouter;
