'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ProtocolClient, UserClient } from '@noah-protocol/sdk';
import ProtocolSection from './components/ProtocolSection';
import UserSection from './components/UserSection';
import IssuerSection from './components/IssuerSection';

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setConnected(true);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🔐 NOAH SDK</h1>
          <p className="text-xl opacity-90">Privacy-Preserving KYC for DeFi - Next.js Example</p>
        </header>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          {!connected ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">Connect MetaMask to get started</p>
              <button
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Connect MetaMask
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Connected Wallet</h3>
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong> {account}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ProtocolSection signer={signer} account={account} />
                <UserSection signer={signer} account={account} />
                <IssuerSection signer={signer} account={account} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
