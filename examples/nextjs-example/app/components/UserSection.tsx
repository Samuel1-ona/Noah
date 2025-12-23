'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useUser } from '@noah-protocol/sdk';

interface UserSectionProps {
  signer: ethers.Signer | null;
  account: string | null;
}

export default function UserSection({ signer, account }: UserSectionProps) {
  const [protocolAddress, setProtocolAddress] = useState('');
  const [credentialHash, setCredentialHash] = useState('');
  const [credentialAge, setCredentialAge] = useState(25);
  const [credentialJurisdiction, setCredentialJurisdiction] = useState('US');
  const [credentialAccredited, setCredentialAccredited] = useState(false);

  const {
    protocolRequirements,
    isLoadingRequirements,
    requirementsError,
    generateProof,
    verifyAndGrantAccess,
    checkCredentialValidity,
  } = useUser(signer, {
    userAddress: account || undefined,
    protocolAddress: protocolAddress || undefined,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
  });

  const [generatedProof, setGeneratedProof] = useState<any>(null);

  const handleCheckCredential = async () => {
    if (!credentialHash) {
      alert('Please enter a credential hash');
      return;
    }

    try {
      const isValid = await checkCredentialValidity.mutateAsync(credentialHash);
      alert(isValid ? 'Credential is valid!' : 'Credential is invalid or revoked');
    } catch (error: any) {
      alert(`Failed to check credential: ${error.message}`);
    }
  };

  const handleGenerateProof = async () => {
    if (!protocolAddress || !credentialHash) {
      alert('Please enter protocol address and credential hash');
      return;
    }

    try {
      if (isLoadingRequirements) {
        alert('Loading requirements, please wait...');
        return;
      }

      if (requirementsError) {
        alert(`Failed to fetch requirements: ${requirementsError.message}. Please make sure the protocol address is correct and requirements are set.`);
        return;
      }

      if (!protocolRequirements) {
        alert('Could not fetch requirements. Please make sure the protocol address is correct and requirements are set.');
        return;
      }

      const proof = await generateProof.mutateAsync({
        credential: {
          credentialHash,
          age: credentialAge,
          jurisdiction: credentialJurisdiction,
          accredited: credentialAccredited ? 1 : 0,
        },
        requirements: {
          ...protocolRequirements,
          protocolAddress,
        },
      });

      setGeneratedProof({
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        credentialHash: proof.credentialHash,
        protocolAddress,
      });

      alert(
        `Proof generated successfully!\n\n` +
        `Credential Hash: ${proof.credentialHash}\n` +
        `Proof generated for protocol: ${protocolAddress}\n\n` +
        `You can now verify and grant access using the button below.`
      );
    } catch (error: any) {
      alert(`Failed to generate proof: ${error.message}`);
    }
  };

  const handleVerifyAndGrantAccess = async () => {
    if (!generatedProof) {
      alert('Please generate a proof first');
      return;
    }

    if (!protocolAddress) {
      alert('Please enter a protocol address');
      return;
    }

    try {
      const result = await verifyAndGrantAccess.mutateAsync({
        proof: generatedProof.proof,
        publicSignals: generatedProof.publicSignals,
        credentialHash: generatedProof.credentialHash,
        protocolAddress: generatedProof.protocolAddress,
        userAddress: account || undefined,
      });

      alert(
        `Access granted successfully!\n\n` +
        `Transaction: ${result.transactionHash}\n` +
        `Protocol: ${generatedProof.protocolAddress}\n` +
        `Credential Hash: ${generatedProof.credentialHash}`
      );
      
      setGeneratedProof(null);
    } catch (error: any) {
      alert(`Failed to verify and grant access: ${error.message}`);
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold text-purple-600 mb-4">User Operations</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Protocol Address:
          </label>
          <input
            type="text"
            value={protocolAddress}
            onChange={(e) => setProtocolAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credential Hash:
          </label>
          <input
            type="text"
            value={credentialHash}
            onChange={(e) => setCredentialHash(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age:
          </label>
          <input
            type="number"
            value={credentialAge}
            onChange={(e) => setCredentialAge(parseInt(e.target.value))}
            min="18"
            max="100"
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jurisdiction:
          </label>
          <input
            type="text"
            value={credentialJurisdiction}
            onChange={(e) => setCredentialJurisdiction(e.target.value)}
            placeholder="US"
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="credential-accredited"
            checked={credentialAccredited}
            onChange={(e) => setCredentialAccredited(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="credential-accredited" className="ml-2 text-sm text-gray-700">
            Accredited Investor
          </label>
        </div>

        <button
          onClick={handleCheckCredential}
          disabled={checkCredentialValidity.isLoading}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {checkCredentialValidity.isLoading ? 'Checking...' : 'Check Credential'}
        </button>

        <button
          onClick={handleGenerateProof}
          disabled={generateProof.isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {generateProof.isLoading ? 'Generating...' : 'Generate Proof'}
        </button>

        {generatedProof && (
          <button
            onClick={handleVerifyAndGrantAccess}
            disabled={verifyAndGrantAccess.isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            {verifyAndGrantAccess.isLoading ? 'Verifying...' : 'Verify & Grant Access'}
          </button>
        )}

        {isLoadingRequirements && (
          <p className="text-sm text-gray-600">Loading protocol requirements...</p>
        )}
      </div>
    </section>
  );
}

