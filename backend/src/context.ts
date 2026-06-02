import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';
import type { Context, UserPayload } from './context-type.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expenseflow_premium_secure_session_token_secret_key';


export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      
      // Auto-process outstanding recurring bills for this active session user
      await processRecurringExpenses(decoded.id);

      return { user: decoded };
    } catch (e) {
      // Invalid or expired token
    }
  }
  return { user: null };
}

async function processRecurringExpenses(userId: number) {
  try {
    const now = new Date();
    // Fetch all active recurring expenses for the user where nextDueDate <= now
    const recurring = await prisma.recurringExpense.findMany({
      where: {
        userId,
        nextDueDate: { lte: now },
      },
    });

    for (const item of recurring) {
      let currentDueDate = new Date(item.nextDueDate);
      
      // Loop to backfill all elapsed cycles (e.g. if user was offline for multiple months)
      while (currentDueDate <= now) {
        await prisma.transaction.create({
          data: {
            title: `${item.title} (Recurring)`,
            amount: item.amount,
            category: item.category,
            type: item.type,
            accountId: item.accountId,
            createdAt: new Date(currentDueDate), // backdated to when it actually fell due
            userId,
          },
        });

        // Advance nextDueDate depending on interval
        if (item.interval === 'weekly') {
          currentDueDate.setDate(currentDueDate.getDate() + 7);
        } else if (item.interval === 'monthly') {
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        } else if (item.interval === 'yearly') {
          currentDueDate.setFullYear(currentDueDate.getFullYear() + 1);
        } else {
          // Fallback safeguard to break loop if interval is corrupted
          break;
        }
      }

      // Commit the updated nextDueDate
      await prisma.recurringExpense.update({
        where: { id: item.id },
        data: { nextDueDate: currentDueDate },
      });
    }
  } catch (e) {
    console.error('Error auto-processing recurring expenses:', e);
  }
}
