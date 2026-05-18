import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAccount, useBalance, useDisconnect, useConnect } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { retrieveApiKey, deleteApiKey, listStoredPlatforms } from '../lib/keyVault';

export interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue: number;
}

export interface ExchangeState {
  connected: boolean;
  hasApiKey: boolean;
  balances: ExchangeBalance[];
  lastUpdated: number | null;
  error: string | null;
  loading: boolean;
}

export interface WalletState {
  solana: {
    connected: boolean;
    address: string | null;
    balance: number | null;
    walletName: string | null;
  };
  evm: {
    connected: boolean;
    address: string | null;
    chainId: number | null;
    balance: number | null;
    walletName: string | null;
  };
  exchanges: Record<string, ExchangeState>;
  anyConnected: boolean;
  totalUsdValue: number;
}

const EXCHANGE_PLATFORMS = ['binance', 'coinbase', 'bybit', 'kraken'] as const;

export function useWalletState() {
  const { publicKey, connected: solConnected, wallet: solWallet, disconnect: solDisconnect, select: solSelect } = useWallet();
  const { connection } = useConnection();
  const { address: evmAddress, isConnected: evmConnected, connector: evmConnector, chainId } = useAccount();
  const { data: evmBalanceData } = useBalance({ address: evmAddress, chainId: mainnet.id });
  const { disconnect: evmDisconnect } = useDisconnect();
  const { connectAsync: evmConnect, connectors: evmConnectors } = useConnect();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [exchanges, setExchanges] = useState<Record<string, ExchangeState>>(() => {
    const init: Record<string, ExchangeState> = {};
    for (const p of EXCHANGE_PLATFORMS) {
      init[p] = { connected: false, hasApiKey: false, balances: [], lastUpdated: null, error: null, loading: false };
    }
    return init;
  });

  useEffect(() => {
    if (!solConnected || !publicKey) {
      setSolBalance(null);
      return;
    }
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        if (!cancelled) setSolBalance(bal / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setSolBalance(null);
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [solConnected, publicKey, connection]);

  useEffect(() => {
    const stored = listStoredPlatforms();
    setExchanges(prev => {
      const next = { ...prev };
      for (const p of EXCHANGE_PLATFORMS) {
        next[p] = { ...next[p], hasApiKey: stored.includes(p) };
      }
      return next;
    });
  }, []);

  const setExchangeConnected = useCallback((platform: string, data: Partial<ExchangeState>) => {
    setExchanges(prev => ({
      ...prev,
      [platform]: { ...prev[platform], ...data },
    }));
  }, []);

  const removeExchangeKey = useCallback((platform: string) => {
    deleteApiKey(platform);
    setExchanges(prev => ({
      ...prev,
      [platform]: { connected: false, hasApiKey: false, balances: [], lastUpdated: null, error: null, loading: false },
    }));
  }, []);

  const state: WalletState = useMemo(() => {
    const solana = {
      connected: solConnected,
      address: publicKey?.toBase58() || null,
      balance: solBalance,
      walletName: solWallet?.adapter.name || null,
    };
    const evm = {
      connected: evmConnected,
      address: evmAddress || null,
      chainId: chainId || null,
      balance: evmBalanceData ? parseFloat(evmBalanceData.formatted) : null,
      walletName: evmConnector?.name || null,
    };
    const anyConnected = solConnected || evmConnected || Object.values(exchanges).some(e => e.connected);
    const totalUsdValue = Object.values(exchanges).reduce((sum, e) => {
      return sum + e.balances.reduce((s, b) => s + b.usdValue, 0);
    }, 0);

    return { solana, evm, exchanges, anyConnected, totalUsdValue };
  }, [solConnected, publicKey, solBalance, solWallet, evmConnected, evmAddress, chainId, evmBalanceData, evmConnector, exchanges]);

  return {
    state,
    solDisconnect,
    solSelect,
    evmDisconnect,
    evmConnect,
    evmConnectors,
    setExchangeConnected,
    removeExchangeKey,
  };
}
