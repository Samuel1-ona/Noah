'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { IssuerClient, generateCredentialHash } from '@noah-protocol/sdk';

interface IssuerSectionProps {
  signer: ethers.Signer | null;
  account: string | null;
}

export default function IssuerSection({ signer, account }: IssuerSectionProps) {
  const [issuerClient, setIssuerClient] = useState<IssuerClient | null>(null);
  const [credentialHash, setCredentialHash] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  
  // Credential hash generator fields
  const [genUserAddress, setGenUserAddress] = useState(account || '');
  const [genAge, setGenAge] = useState(25);
  const [genJurisdiction, setGenJurisdiction] = useState('US');
  const [genAccredited, setGenAccredited] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');

  useEffect(() => {
    if (signer) {
      const client = new IssuerClient(signer, {
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
      });
      setIssuerClient(client);
    }
  }, [signer]);

  const handleGenerateHash = () => {
    try {
      if (!genUserAddress) {
        setMessage('Please enter a user address');
        setMessageType('error');
        return;
      }

      const result = generateCredentialHash({
        userAddress: genUserAddress,
        age: genAge,
        jurisdiction: genJurisdiction,
        accredited: genAccredited,
      });

      setGeneratedHash(result.credentialHash);
      setCredentialHash(result.credentialHash); // Auto-fill the credential hash field
      setMessage(
        `Credential hash generated!\nHash: ${result.credentialHash}\nJurisdiction Hash: ${result.jurisdictionHash}`
      );
      setMessageType('success');
    } catch (error: any) {
      setMessage(`Failed to generate hash: ${error.message}`);
      setMessageType('error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('Copied to clipboard!');
      setMessageType('success');
      setTimeout(() => setMessage(null), 2000);
    }).catch(() => {
      setMessage('Failed to copy');
      setMessageType('error');
    });
  };

  const handleRegisterCredential = async () => {
    if (!credentialHash || !userAddress) {
      setMessage('Please enter both credential hash and user address');
      setMessageType('error');
      return;
    }

    const hashToRegister = credentialHash;

    try {
      setIsRegistering(true);
      setMessage(null);
      const result = await issuerClient!.registerCredential(credentialHash, userAddress, true);
      setMessage(
        `Credential registered successfully!\nCredential Hash: ${hashToRegister}\nTransaction: ${result.transactionHash}`
      );
      setMessageType('success');
      setUserAddress('');
    } catch (error: any) {
      setMessage(`Failed to register credential: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevokeCredential = async () => {
    if (!credentialHash) {
      setMessage('Please enter a credential hash');
      setMessageType('error');
      return;
    }

    const hashToRevoke = credentialHash;

    try {
      setIsRevoking(true);
      setMessage(null);
      const result = await issuerClient!.revokeCredential(credentialHash, true);
      setMessage(
        `Credential revoked successfully!\nCredential Hash: ${hashToRevoke}\nTransaction: ${result.transactionHash}`
      );
      setMessageType('success');
      setCredentialStatus(null);
    } catch (error: any) {
      setMessage(`Failed to revoke credential: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCheckCredential = async () => {
    if (!credentialHash) {
      setMessage('Please enter a credential hash');
      setMessageType('error');
      return;
    }

    try {
      setIsChecking(true);
      setMessage(null);
      const status = await issuerClient!.checkCredential(credentialHash);
      setCredentialStatus(status);
      setMessage(`Credential is ${status.isValid ? 'valid' : 'invalid'}${status.isRevoked ? ' and revoked' : ''}`);
      setMessageType(status.isValid && !status.isRevoked ? 'success' : 'error');
    } catch (error: any) {
      setMessage(`Failed to check credential: ${error.message}`);
      setMessageType('error');
      setCredentialStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold text-purple-600 mb-4">Issuer Operations</h2>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">Generate Credential Hash</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Address:</label>
            <input
              type="text"
              value={genUserAddress}
              onChange={(e) => setGenUserAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age:</label>
            <input
              type="number"
              value={genAge}
              onChange={(e) => setGenAge(parseInt(e.target.value))}
              min="18"
              max="100"
              className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction:</label>
            <input
              type="text"
              value={genJurisdiction}
              onChange={(e) => setGenJurisdiction(e.target.value)}
              placeholder="US"
              className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={genAccredited}
              onChange={(e) => setGenAccredited(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Accredited Investor</label>
          </div>
          <button
            onClick={handleGenerateHash}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            Generate Credential Hash
          </button>
          {generatedHash && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-3">
              <h4 className="font-semibold text-green-900 mb-2">Generated Credential Hash:</h4>
              <p className="text-xs font-mono break-all text-green-800 mb-2">{generatedHash}</p>
              <button
                onClick={() => copyToClipboard(generatedHash)}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-1 px-3 rounded transition-colors"
              >
                Copy Hash
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Credential Hash:</label>
          <input
            type="text"
            value={credentialHash}
            onChange={(e) => setCredentialHash(e.target.value)}
            placeholder="0x... (or generate above)"
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Address (for registration):</label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <button
          onClick={handleRegisterCredential}
          disabled={isRegistering || !issuerClient}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {isRegistering ? 'Registering...' : 'Register Credential'}
        </button>

        <button
          onClick={handleRevokeCredential}
          disabled={isRevoking || !issuerClient}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {isRevoking ? 'Revoking...' : 'Revoke Credential'}
        </button>

        <button
          onClick={handleCheckCredential}
          disabled={isChecking || !issuerClient}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check Credential Status'}
        </button>

        {message && (
          <div className={`p-3 rounded-md ${
            messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <p style={{ whiteSpace: 'pre-line' }} className="text-sm">{message}</p>
          </div>
        )}

        {credentialStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Credential Status:</h4>
            <p className="text-sm text-blue-800">Hash: {credentialStatus.credentialHash}</p>
            <p className="text-sm text-blue-800">Valid: {credentialStatus.isValid ? 'Yes' : 'No'}</p>
            <p className="text-sm text-blue-800">Revoked: {credentialStatus.isRevoked ? 'Yes' : 'No'}</p>
            {credentialStatus.issuer && <p className="text-sm text-blue-800">Issuer: {credentialStatus.issuer}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

