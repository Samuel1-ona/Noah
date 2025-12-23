import { ethers } from 'ethers';
import { CHAIN_ID, RPC_URL, MANTLE_SEPOLIA } from '../config/constants.js';

/**
 * Wallet Service
 * Handles Web3 wallet connection and management
 */
class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.listeners = new Set();
    this.STORAGE_KEY = 'noah_wallet_connected';
    
    // Try to restore connection on initialization
    this.restoreConnection();
  }

  /**
   * Check if MetaMask is installed
   * @returns {boolean} True if MetaMask is available
   */
  isMetaMaskInstalled() {
    if (typeof window === 'undefined') return false;
    
    // Check for MetaMask specifically
    const ethereum = window.ethereum;
    if (!ethereum) return false;
    
    // MetaMask sets isMetaMask property
    return ethereum.isMetaMask === true;
  }

  /**
   * Get MetaMask provider
   * @returns {Object|null} MetaMask provider or null
   */
  getMetaMaskProvider() {
    if (typeof window === 'undefined') return null;
    return window.ethereum?.isMetaMask ? window.ethereum : null;
  }

  /**
   * Connect to MetaMask wallet
   * @returns {Promise<Object>} {account, chainId}
   */
  async connect() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask extension to continue.');
    }

    const ethereum = this.getMetaMaskProvider();
    if (!ethereum) {
      throw new Error('MetaMask provider not found. Please ensure MetaMask is installed and enabled.');
    }

    try {
      // Request account access from MetaMask
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      this.account = accounts[0];
      this.provider = new ethers.BrowserProvider(ethereum);
      this.signer = await this.provider.getSigner();

      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      // Check if on correct network
      if (this.chainId !== CHAIN_ID) {
        try {
          await this.switchNetwork();
          // Wait a bit for network to switch
          await new Promise(resolve => setTimeout(resolve, 500));
          // Refresh network after switching
          const newNetwork = await this.provider.getNetwork();
          this.chainId = Number(newNetwork.chainId);
        } catch (networkError) {
          // Network switch errors are non-fatal - connection can still succeed
          // Error might be due to network already existing with different params
          console.warn('Network switch warning:', networkError.message);
          // Try to get updated chainId anyway
          try {
            const updatedNetwork = await this.provider.getNetwork();
            this.chainId = Number(updatedNetwork.chainId);
          } catch (e) {
            // Ignore
          }
        }
      }

      // Set up event listeners
      this.setupEventListeners();

      // Save connection state to localStorage
      this.saveConnectionState();

      this.notifyListeners({ account: this.account, chainId: this.chainId, connected: true });

      return {
        account: this.account,
        chainId: this.chainId,
        provider: this.provider,
        signer: this.signer,
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.account = null;
    this.provider = null;
    this.signer = null;
    this.chainId = null;
    this.removeEventListeners();
    this.clearConnectionState();
    this.notifyListeners({ account: null, chainId: null, connected: false });
  }

  /**
   * Switch to Mantle Sepolia network
   * @returns {Promise<void>}
   */
  async switchNetwork() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    const ethereum = this.getMetaMaskProvider();
    if (!ethereum) {
      throw new Error('MetaMask provider not found');
    }

    const chainIdHex = `0x${CHAIN_ID.toString(16)}`;

    // First, try to switch directly (network might already exist)
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      return; // Successfully switched
    } catch (switchError) {
      // Error 4001 means user rejected
      if (switchError.code === 4001) {
        throw new Error('User rejected network switch. Please switch to Mantle Sepolia manually in MetaMask.');
      }
      
      // Error 4902 means chain doesn't exist, so we need to add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: MANTLE_SEPOLIA.name,
                nativeCurrency: MANTLE_SEPOLIA.nativeCurrency,
                rpcUrls: MANTLE_SEPOLIA.rpcUrls.default.http,
                blockExplorerUrls: [MANTLE_SEPOLIA.blockExplorers.default.url],
              },
            ],
          });
          // Retry switch after adding
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          return; // Successfully added and switched
        } catch (addError) {
          // If add fails with -32602, network exists with different params
          // Just try switching again (user might have manually switched)
          if (addError.code === -32602) {
            try {
              await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
              });
              return; // Successfully switched
            } catch (retryError) {
              // If still fails, network might be in a weird state
              throw new Error(`Network already exists with different parameters. Please switch to Mantle Sepolia (Chain ID: ${CHAIN_ID}) manually in MetaMask.`);
            }
          }
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        // Other errors - network might already exist with different params
        // Try one more time to switch (user might have manually added it)
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          return; // Successfully switched
        } catch (retryError) {
          throw new Error(`Network switch failed: ${switchError.message}. Please switch to Mantle Sepolia (Chain ID: ${CHAIN_ID}) manually in MetaMask.`);
        }
      }
    }
  }

  /**
   * Get current account
   * @returns {string|null} Current account address
   */
  getAccount() {
    return this.account;
  }

  /**
   * Get current provider
   * @returns {ethers.Provider|null} Current provider
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Get current signer
   * @returns {ethers.Signer|null} Current signer
   */
  getSigner() {
    return this.signer;
  }

  /**
   * Check if wallet is connected
   * @returns {boolean} True if wallet is connected
   */
  isConnected() {
    return this.account !== null && this.provider !== null;
  }

  /**
   * Add event listener for wallet state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onStateChange(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state changes
   * @param {Object} state - New state
   */
  notifyListeners(state) {
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in wallet state listener:', error);
      }
    });
  }

  /**
   * Set up MetaMask event listeners
   */
  setupEventListeners() {
    const ethereum = this.getMetaMaskProvider();
    if (!ethereum) return;

    // Remove existing listeners first to avoid duplicates
    this.removeEventListeners();

    // Handle account changes in MetaMask
    ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.account = accounts[0];
        // Update provider and signer for new account
        if (ethereum) {
          this.provider = new ethers.BrowserProvider(ethereum);
          this.provider.getSigner().then(signer => {
            this.signer = signer;
          });
        }
        this.saveConnectionState();
        this.notifyListeners({ account: this.account, chainId: this.chainId });
      }
    });

    // Handle chain changes in MetaMask
    ethereum.on('chainChanged', async (chainId) => {
      this.chainId = parseInt(chainId, 16);
      if (this.provider && ethereum) {
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
      }
      this.saveConnectionState();
      this.notifyListeners({ account: this.account, chainId: this.chainId });
    });

    // Handle disconnect from MetaMask
    ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    const ethereum = this.getMetaMaskProvider();
    if (!ethereum) return;

    ethereum.removeAllListeners('accountsChanged');
    ethereum.removeAllListeners('chainChanged');
    ethereum.removeAllListeners('disconnect');
  }

  /**
   * Save connection state to localStorage
   */
  saveConnectionState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        account: this.account,
        chainId: this.chainId,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save wallet connection state:', error);
    }
  }

  /**
   * Clear connection state from localStorage
   */
  clearConnectionState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear wallet connection state:', error);
    }
  }

  /**
   * Restore connection from localStorage
   * This will attempt to reconnect if the wallet was previously connected
   */
  async restoreConnection() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return;

      const { account, chainId, timestamp } = JSON.parse(saved);
      
      // Check if saved state is recent (within 24 hours)
      const isRecent = timestamp && (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
      if (!isRecent) {
        this.clearConnectionState();
        return;
      }

      // Check if MetaMask is available
      if (!this.isMetaMaskInstalled()) {
        this.clearConnectionState();
        return;
      }

      const ethereum = this.getMetaMaskProvider();
      if (!ethereum) {
        this.clearConnectionState();
        return;
      }

      // Check if the account is still connected in MetaMask
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0 || accounts[0] !== account) {
        this.clearConnectionState();
        return;
      }

      // Restore connection
      this.account = accounts[0];
      this.provider = new ethers.BrowserProvider(ethereum);
      this.signer = await this.provider.getSigner();
      
      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      // Set up event listeners
      this.setupEventListeners();

      // Notify listeners of restored connection
      this.notifyListeners({ account: this.account, chainId: this.chainId, connected: true, restored: true });
    } catch (error) {
      console.warn('Failed to restore wallet connection:', error);
      this.clearConnectionState();
    }
  }
}

// Export singleton instance
export default new WalletService();

