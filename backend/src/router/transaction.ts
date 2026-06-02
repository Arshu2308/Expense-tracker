import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const transactionRouter = router({
  getTransactions: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.transaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }),

  addTransaction: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        amount: z.number().positive(),
        category: z.string().min(1),
        type: z.enum(['INCOME', 'EXPENSE']),
        accountId: z.number(),
        tags: z.array(z.string()).default([]),
        createdAt: z.string().optional(),
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

      return await prisma.transaction.create({
        data: {
          title: input.title,
          amount: input.amount,
          category: input.category,
          type: input.type,
          tags: input.tags,
          accountId: input.accountId,
          createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
          userId: ctx.user.id,
        },
      });
    }),

  deleteTransaction: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.transaction.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found or unauthorized',
        });
      }

      return await prisma.transaction.delete({
        where: { id: input.id },
      });
    }),

  updateTransaction: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        amount: z.number().positive().optional(),
        category: z.string().optional(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
        accountId: z.number().optional(),
        tags: z.array(z.string()).optional(),
        createdAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found or unauthorized',
        });
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.createdAt !== undefined) updateData.createdAt = new Date(data.createdAt);

      if (data.accountId !== undefined) {
        // Verify account belongs to user
        const account = await prisma.account.findUnique({
          where: { id: data.accountId },
        });
        if (!account || account.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid account mapping selected',
          });
        }
        updateData.accountId = data.accountId;
      }

      return await prisma.transaction.update({
        where: { id },
        data: updateData,
      });
    }),
});
