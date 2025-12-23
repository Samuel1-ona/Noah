import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import walletService from '../services/walletService';
import contractClient from '../services/contractClient';

/**
 * Custom hook to monitor wallet connection and automatically update page data
 * When wallet connects, it invalidates all queries to refresh data
 */
export function useWalletMonitor() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize contract client if wallet is already connected
    const account = walletService.getAccount();
    if (account) {
      const provider = walletService.getProvider();
      if (provider) {
        contractClient.initialize(provider);
      }
    }

    // Subscribe to wallet state changes
    const unsubscribe = walletService.onStateChange(({ account: newAccount, connected, restored }) => {
      // When wallet connects (new or restored), refresh data
      if (connected && newAccount) {
        // Initialize contract client with new provider
        const provider = walletService.getProvider();
        if (provider) {
          contractClient.initialize(provider);
        }

        // Invalidate all queries to refresh page data
        // This ensures pages get updated immediately when wallet connects
        queryClient.invalidateQueries();
      } else if (!connected && !newAccount) {
        // Wallet disconnected - invalidate queries to clear account-dependent data
        queryClient.invalidateQueries();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}

