import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SolanaProvider } from './SolanaProvider';
import { EVMProvider } from './EVMProvider';

const walletQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

interface CombinedProviderProps {
  children: ReactNode;
}

export function CombinedProvider({ children }: CombinedProviderProps) {
  return (
    <QueryClientProvider client={walletQueryClient}>
      <SolanaProvider>
        <EVMProvider>
          {children}
        </EVMProvider>
      </SolanaProvider>
    </QueryClientProvider>
  );
}
