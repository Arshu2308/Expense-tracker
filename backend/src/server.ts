import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createContext } from './context.js';
import { appRouter } from './router/index.js';

const app = express();

// Configure CORS for dynamic frontend origins (Next.js client)
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Mount the typesafe tRPC route adapters
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ExpenseFlow Backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
