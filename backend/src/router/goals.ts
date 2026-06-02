import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const goalsRouter = router({
  getSavingsGoals: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.savingsGoal.findMany({
      where: { userId: ctx.user.id },
      orderBy: { id: 'desc' },
    });
  }),

  addSavingsGoal: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        target: z.number().positive(),
        saved: z.number().nonnegative().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.savingsGoal.create({
        data: {
          name: input.name,
          target: input.target,
          saved: input.saved,
          userId: ctx.user.id,
        },
      });
    }),

  allocateToGoal: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.savingsGoal.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Savings goal not found or unauthorized',
        });
      }

      const newSaved = Math.max(0, Math.min(existing.target, existing.saved + input.amount));

      return await prisma.savingsGoal.update({
        where: { id: input.id },
        data: { saved: newSaved },
      });
    }),

  deleteSavingsGoal: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.savingsGoal.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Savings goal not found or unauthorized',
        });
      }

      return await prisma.savingsGoal.delete({
        where: { id: input.id },
      });
    }),
});
