'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UserProvider as Auth0Provider } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import { UserProvider } from '@/contexts/UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on client errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
            onError: (error) => {
              console.error('Mutation error:', error);
              // TODO: Show toast notification or global error handler
            },
          },
        },
      })
  );

  return (
    <Auth0Provider>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          {children}
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </UserProvider>
      </QueryClientProvider>
    </Auth0Provider>
  );
}