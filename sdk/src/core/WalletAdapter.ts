import { ethers, BrowserProvider } from 'ethers';
import type {
  Provider,
  Signer,
  Eip1193Provider
} from 'ethers';

/**
 * Supported wallet types
 */
export type WalletType = 'metamask' | 'walletconnect' | 'injected' | 'custom';

/**
 * Configuration for wallet adapter
 */
export interface WalletAdapterConfig {
  /**
   * Optional RPC URL for fallback provider
   */
  rpcUrl?: string;

  /**
   * Optional chain ID to validate against
   */
  chainId?: number;

  /**
   * Optional network configuration for switching networks
   */
  networkConfig?: {
    chainId: number;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  };
}

/**
 * EIP-6963 Provider Information
 */
export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: Eip1193Provider;
}

export interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: EIP6963ProviderDetail;
}
/**
 * Wallet connection state
 */
export interface WalletState {
  account: string | null;
  chainId: number | null;
  connected: boolean;
  provider: Provider | null;
  signer: Signer | null;
}

/**
 * Wallet adapter for abstracting wallet connections
 * Supports MetaMask, WalletConnect, and any ethers.js-compatible wallet
 */
export class WalletAdapter {
  private provider: Provider | null = null;
  private signer: Signer | null = null;
  private account: string | null = null;
  private chainId: number | null = null;
  private walletType: WalletType | null = null;
  private config: WalletAdapterConfig;
  private listeners: Set<(state: WalletState) => void> = new Set();
  private eip1193Provider: Eip1193Provider | null = null;
  private discoveredProviders: EIP6963ProviderDetail[] = [];

  /**
   * Create a new WalletAdapter instance
   * @param config Optional configuration
   */
  constructor(config: WalletAdapterConfig = {}) {
    this.config = {
      chainId: 43113, // Fuji default
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      ...config
    };

    if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
      this.discoverWallets();
    }
  }

  /**
   * Discover wallets via EIP-6963
   */
  private discoverWallets(): void {
    const handler = (event: Event) => {
      const e = event as EIP6963AnnounceProviderEvent;
      if (!this.discoveredProviders.some(p => p.info.uuid === e.detail.info.uuid)) {
        this.discoveredProviders.push(e.detail);
        this.notifyListeners(this.getState());
      }
    };

    const win = (globalThis as any).window;
    if (win) {
      win.addEventListener("eip6963:announceProvider", handler);
      win.dispatchEvent(new Event("eip6963:requestProvider"));
    }
  }

  /**
   * Get list of discovered EIP-6963 wallets
   */
  getDiscoveredWallets(): EIP6963ProviderDetail[] {
    return this.discoveredProviders;
  }

  /**
   * Connect using an EIP-1193 provider (e.g., MetaMask, WalletConnect)
   * @param provider EIP-1193 provider (window.ethereum, WalletConnect provider, etc.)
   * @param walletType Type of wallet being connected
   * @returns Promise resolving to wallet state
   */
  async connectWithProvider(
    provider: Eip1193Provider,
    walletType: WalletType = 'injected'
  ): Promise<WalletState> {
    try {
      this.eip1193Provider = provider;
      this.walletType = walletType;

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      this.account = accounts[0];
      const browserProvider = new BrowserProvider(provider);
      this.provider = browserProvider;
      this.signer = await browserProvider.getSigner();

      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      // Validate chain ID if configured
      if (this.config.chainId && this.chainId !== this.config.chainId) {
        if (this.config.networkConfig) {
          await this.switchNetwork();
        } else {
          console.warn(
            `Chain ID mismatch: expected ${this.config.chainId}, got ${this.chainId}`
          );
        }
      }

      // Set up event listeners
      this.setupEventListeners(provider);

      const state = this.getState();
      this.notifyListeners(state);
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect wallet: ${message}`);
    }
  }

  /**
   * Connect using MetaMask (convenience method)
   * @returns Promise resolving to wallet state
   */
  async connectMetaMask(): Promise<WalletState> {
    if (typeof globalThis === 'undefined' || typeof (globalThis as any).window === 'undefined') {
      throw new Error('MetaMask is only available in browser environments');
    }

    const window = (globalThis as any).window;
    const ethereum = window.ethereum;
    if (!ethereum) {
      throw new Error(
        'MetaMask is not installed. Please install MetaMask extension to continue.'
      );
    }

    // Check if it's MetaMask specifically
    const isMetaMask = ethereum.isMetaMask === true;
    return this.connectWithProvider(ethereum, isMetaMask ? 'metamask' : 'injected');
  }

  /**
   * Connect using an existing ethers Provider
   * @param provider ethers Provider instance
   * @returns Promise resolving to wallet state
   */
  async connectWithProviderInstance(provider: Provider): Promise<WalletState> {
    try {
      this.provider = provider;
      this.walletType = 'custom';

      // Try to get signer if provider is a BrowserProvider
      if (provider instanceof BrowserProvider) {
        try {
          this.signer = await provider.getSigner();
          this.account = await this.signer.getAddress();
        } catch (error) {
          // Provider might not have a signer (read-only)
          console.warn('Provider does not have a signer, read-only mode');
        }
      }

      // Get current chain ID
      const network = await provider.getNetwork();
      this.chainId = Number(network.chainId);

      const state = this.getState();
      this.notifyListeners(state);
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect with provider: ${message}`);
    }
  }

  /**
   * Connect using an existing Signer
   * @param signer ethers Signer instance
   * @returns Promise resolving to wallet state
   */
  async connectWithSigner(signer: Signer): Promise<WalletState> {
    try {
      this.signer = signer;
      this.walletType = 'custom';

      // Get provider from signer if available
      if (signer.provider) {
        this.provider = signer.provider;
        const network = await signer.provider.getNetwork();
        this.chainId = Number(network.chainId);
      }

      // Get account address
      this.account = await signer.getAddress();

      const state = this.getState();
      this.notifyListeners(state);
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect with signer: ${message}`);
    }
  }

  /**
   * Connect using RPC URL (read-only provider)
   * @param rpcUrl RPC endpoint URL
   * @returns Promise resolving to wallet state
   */
  async connectWithRpc(rpcUrl: string): Promise<WalletState> {
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.walletType = 'custom';

      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      // No signer for RPC-only connection (read-only)
      this.signer = null;
      this.account = null;

      const state = this.getState();
      this.notifyListeners(state);
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect with RPC: ${message}`);
    }
  }

  /**
   * Switch to configured network
   * @returns Promise that resolves when network is switched
   */
  async switchNetwork(): Promise<void> {
    if (!this.config.networkConfig) {
      throw new Error('Network configuration not provided');
    }

    if (!this.eip1193Provider) {
      throw new Error('Network switching requires an EIP-1193 provider');
    }

    const { chainId, chainName, nativeCurrency, rpcUrls, blockExplorerUrls } =
      this.config.networkConfig;
    const chainIdHex = `0x${chainId.toString(16)}`;

    try {
      // Try to switch directly
      await this.eip1193Provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      return;
    } catch (switchError: any) {
      // User rejected
      if (switchError.code === 4001) {
        throw new Error(
          'User rejected network switch. Please switch manually in your wallet.'
        );
      }

      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await this.eip1193Provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName,
                nativeCurrency,
                rpcUrls: Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls],
                blockExplorerUrls: blockExplorerUrls
                  ? Array.isArray(blockExplorerUrls)
                    ? blockExplorerUrls
                    : [blockExplorerUrls]
                  : undefined,
              },
            ],
          });

          // Retry switch after adding
          await this.eip1193Provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          return;
        } catch (addError: any) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      }

      throw new Error(`Failed to switch network: ${switchError.message}`);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.removeEventListeners();
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.walletType = null;
    this.eip1193Provider = null;

    const state = this.getState();
    this.notifyListeners(state);
  }

  /**
   * Get current wallet state
   * @returns Current wallet state
   */
  getState(): WalletState {
    return {
      account: this.account,
      chainId: this.chainId,
      connected: this.account !== null && this.provider !== null,
      provider: this.provider,
      signer: this.signer,
    };
  }

  /**
   * Get current provider
   * @returns Current provider or null
   */
  getProvider(): Provider | null {
    return this.provider;
  }

  /**
   * Get current signer
   * @returns Current signer or null
   */
  getSigner(): Signer | null {
    return this.signer;
  }

  /**
   * Get current account address
   * @returns Current account address or null
   */
  getAccount(): string | null {
    return this.account;
  }

  /**
   * Get current chain ID
   * @returns Current chain ID or null
   */
  getChainId(): number | null {
    return this.chainId;
  }

  /**
   * Get wallet type
   * @returns Wallet type or null
   */
  getWalletType(): WalletType | null {
    return this.walletType;
  }

  /**
   * Check if wallet is connected
   * @returns True if wallet is connected
   */
  isConnected(): boolean {
    return this.account !== null && this.provider !== null;
  }

  /**
   * Subscribe to wallet state changes
   * @param callback Callback function to receive state updates
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: WalletState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state changes
   * @param state New wallet state
   */
  private notifyListeners(state: WalletState): void {
    this.listeners.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in wallet state listener:', error);
      }
    });
  }

  /**
   * Set up event listeners for EIP-1193 provider
   * @param provider EIP-1193 provider
   */
  private setupEventListeners(provider: Eip1193Provider & { on?: (event: string, handler: (...args: any[]) => void) => void }): void {
    this.removeEventListeners();

    if (!provider.on) {
      console.warn('Provider does not support event listeners');
      return;
    }

    // Handle account changes
    provider.on('accountsChanged', async (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.account = accounts[0];
        if (this.provider instanceof BrowserProvider) {
          this.signer = await this.provider.getSigner();
        }
        const state = this.getState();
        this.notifyListeners(state);
      }
    });

    // Handle chain changes
    provider.on('chainChanged', async (chainId: string) => {
      this.chainId = parseInt(chainId, 16);
      if (this.provider instanceof BrowserProvider) {
        this.signer = await this.provider.getSigner();
      }
      const state = this.getState();
      this.notifyListeners(state);
    });

    // Handle disconnect
    provider.on('disconnect', () => {
      this.disconnect();
    });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (this.eip1193Provider && 'removeAllListeners' in this.eip1193Provider) {
      try {
        (this.eip1193Provider as any).removeAllListeners('accountsChanged');
        (this.eip1193Provider as any).removeAllListeners('chainChanged');
        (this.eip1193Provider as any).removeAllListeners('disconnect');
      } catch (error) {
        // Some providers might not support removeAllListeners
        console.warn('Failed to remove event listeners:', error);
      }
    }
  }
}

/**
 * Check if MetaMask is installed
 * @returns True if MetaMask is available
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof globalThis === 'undefined' || typeof (globalThis as any).window === 'undefined') return false;
  const window = (globalThis as any).window;
  const ethereum = window.ethereum;
  return ethereum?.isMetaMask === true;
}

/**
 * Get MetaMask provider if available
 * @returns MetaMask provider or null
 */
export function getMetaMaskProvider(): Eip1193Provider | null {
  if (typeof globalThis === 'undefined' || typeof (globalThis as any).window === 'undefined') return null;
  const window = (globalThis as any).window;
  const ethereum = window.ethereum;
  return ethereum?.isMetaMask ? ethereum : null;
}
