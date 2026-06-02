import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const recurringRouter = router({
  getRecurringExpenses: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.recurringExpense.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  addRecurringExpense: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        amount: z.number().positive(),
        category: z.string().min(1),
        type: z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
        interval: z.enum(['weekly', 'monthly', 'yearly']),
        accountId: z.number(),
        nextDueDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify account belongs to user
      const account = await prisma.account.findUnique({
        where: { id: input.accountId },
      });
      if (!account || account.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid account mapping selected',
        });
      }

      return await prisma.recurringExpense.create({
        data: {
          title: input.title,
          amount: input.amount,
          category: input.category,
          type: input.type,
          interval: input.interval,
          accountId: input.accountId,
          nextDueDate: new Date(input.nextDueDate),
          userId: ctx.user.id,
        },
      });
    }),

  deleteRecurringExpense: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.recurringExpense.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recurring expense not found or unauthorized',
        });
      }

      return await prisma.recurringExpense.delete({
        where: { id: input.id },
      });
    }),
});
