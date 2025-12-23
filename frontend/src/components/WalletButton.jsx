import React, { useState, useEffect } from 'react';
import { Button, Box, Typography } from '@mui/material';
import walletService from '../services/walletService';

function WalletButton() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected (including restored connections from constructor)
    if (walletService.isConnected()) {
      const currentAccount = walletService.getAccount();
      setAccount(currentAccount);
    }

    // Subscribe to wallet state changes
    const unsubscribe = walletService.onStateChange(({ account: newAccount }) => {
      setAccount(newAccount);
      // Note: Page updates are handled by useWalletMonitor hook in each dashboard
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { account: connectedAccount } = await walletService.connect();
      setAccount(connectedAccount);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      
      // Handle user rejection gracefully
      if (error.message && error.message.includes('rejected')) {
        // User rejected - don't show error, just stop connecting
        return;
      }
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to connect wallet. Please try again.';
      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setAccount(null);
  };

  if (account) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {`${account.slice(0, 6)}...${account.slice(-4)}`}
        </Typography>
        <Button variant="outlined" color="inherit" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </Box>
    );
  }

  if (!walletService.isMetaMaskInstalled()) {
    return (
      <Button
        variant="contained"
        color="inherit"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Install MetaMask
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      color="inherit"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting to MetaMask...' : 'Connect MetaMask'}
    </Button>
  );
}

export default WalletButton;

