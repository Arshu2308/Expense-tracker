import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '../db.js';

export const insightsRouter = router({
  getAIInsights: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId: ctx.user.id },
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonthDate = new Date();
    prevMonthDate.setMonth(now.getMonth() - 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    // Aggregate monthly numbers
    let curFood = 0, prevFood = 0;
    let curTrans = 0, prevTrans = 0;
    let curIncome = 0, curExpense = 0;
    const catSpends: Record<string, number> = {};

    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      const m = d.getMonth();
      const y = d.getFullYear();

      if (m === currentMonth && y === currentYear) {
        if (t.type === 'INCOME') {
          curIncome += t.amount;
        } else {
          curExpense += t.amount;
          catSpends[t.category] = (catSpends[t.category] || 0) + t.amount;
          if (t.category === 'Food') curFood += t.amount;
          if (t.category === 'Transport') curTrans += t.amount;
        }
      } else if (m === prevMonth && y === prevYear) {
        if (t.type === 'EXPENSE') {
          if (t.category === 'Food') prevFood += t.amount;
          if (t.category === 'Transport') prevTrans += t.amount;
        }
      }
    });

    const insights: string[] = [];

    // Food Domain comparative insight
    if (curFood > 0) {
      if (prevFood > 0) {
        const diffPercent = Math.round(((curFood - prevFood) / prevFood) * 100);
        if (diffPercent > 0) {
          insights.push(`You spent ${diffPercent}% more on Food this month compared to last month.`);
        } else if (diffPercent < 0) {
          insights.push(`Awesome! You reduced your Food spending by ${Math.abs(diffPercent)}% compared to last month.`);
        }
      } else {
        insights.push(`Food spending is ₹${Math.round(curFood)} this month. Keep groceries under budget limits!`);
      }
    }

    // Transport comparative insight
    if (curTrans > prevTrans) {
      const diffAmt = Math.round(curTrans - prevTrans);
      insights.push(`Transport spending increased by ₹${diffAmt} compared to last month.`);
    } else if (curTrans > 0 && curTrans < prevTrans) {
      const diffAmt = Math.round(prevTrans - curTrans);
      insights.push(`You saved ₹${diffAmt} on Transport this month. Excellent commuting choices!`);
    }

    // Savings Rate calculations
    if (curIncome > 0) {
      const savings = curIncome - curExpense;
      const rate = Math.round((savings / curIncome) * 100);
      if (rate > 0) {
        insights.push(`Your savings rate is ${rate}% this month. Excellent wealth retention!`);
      } else {
        insights.push(`Outflow exceeded monthly deposits by ₹${Math.round(Math.abs(savings))}. Consider checking category budgets.`);
      }
    } else {
      insights.push(`No deposits recorded this month. Try setting up recurring salary templates!`);
    }

    // Top spending category
    let topCat = '';
    let topAmt = 0;
    Object.keys(catSpends).forEach(cat => {
      const amt = catSpends[cat] || 0;
      if (amt > topAmt) {
        topAmt = amt;
        topCat = cat;
      }
    });

    if (topCat) {
      insights.push(`Top spending domain this month is ${topCat} (₹${Math.round(topAmt)}).`);
    }

    if (insights.length === 0) {
      insights.push('Ledger sync successful. AI Insights will compile automatically as you record transactions.');
    }

    return insights;
  }),
});
