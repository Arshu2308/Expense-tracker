import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const budgetRouter = router({
  getBudgets: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.budget.findMany({
      where: { userId: ctx.user.id },
    });
  }),

  setBudget: protectedProcedure
    .input(
      z.object({
        category: z.string().min(1),
        limit: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.budget.upsert({
        where: {
          userId_category: {
            userId: ctx.user.id,
            category: input.category,
          },
        },
        update: {
          limit: input.limit,
        },
        create: {
          category: input.category,
          limit: input.limit,
          userId: ctx.user.id,
        },
      });
    }),
});
