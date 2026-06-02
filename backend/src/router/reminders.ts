import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const remindersRouter = router({
  getBillReminders: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.billReminder.findMany({
      where: { userId: ctx.user.id },
      orderBy: { dueDate: 'asc' },
    });
  }),

  addBillReminder: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        amount: z.number().positive(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.billReminder.create({
        data: {
          title: input.title,
          amount: input.amount,
          dueDate: new Date(input.dueDate),
          userId: ctx.user.id,
        },
      });
    }),

  toggleBillPaid: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.billReminder.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bill reminder not found or unauthorized',
        });
      }

      return await prisma.billReminder.update({
        where: { id: input.id },
        data: { isPaid: !existing.isPaid },
      });
    }),

  deleteBillReminder: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.billReminder.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bill reminder not found or unauthorized',
        });
      }

      return await prisma.billReminder.delete({
        where: { id: input.id },
      });
    }),
});
