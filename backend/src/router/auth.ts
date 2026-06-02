import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc.js';
import { prisma } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expenseflow_premium_secure_session_token_secret_key';

export const authRouter = router({
  signUp: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          accounts: {
            create: [
              { name: 'Cash', type: 'CASH' },
              { name: 'Bank Account', type: 'BANK' },
              { name: 'UPI Wallet', type: 'UPI' },
              { name: 'Credit Card', type: 'CREDIT_CARD' }
            ]
          }
        },
      });

      return { success: true };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const isMatch = await bcrypt.compare(input.password, user.password);
      if (!isMatch) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }),
});
