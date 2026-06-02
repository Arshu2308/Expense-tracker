import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/router/index';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:5000/trpc',
      async headers() {
        const token = typeof window !== 'undefined' ? localStorage.getItem('expenseflow_token') : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
