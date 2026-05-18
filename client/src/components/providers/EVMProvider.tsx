import { type ReactNode } from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Edge' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

interface EVMProviderProps {
  children: ReactNode;
}

export function EVMProvider({ children }: EVMProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {children}
    </WagmiProvider>
  );
}

export { wagmiConfig };
