'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { ProtocolClient, useProtocol } from '@noah-protocol/sdk';

interface ProtocolSectionProps {
  signer: ethers.Signer | null;
  account: string | null;
}

export default function ProtocolSection({ signer, account }: ProtocolSectionProps) {
  const {
    requirements,
    isLoadingRequirements,
    setRequirements,
    hasAccess,
    isLoadingAccess,
  } = useProtocol(signer, {
    protocolAddress: account || undefined,
  });

  const [minAge, setMinAge] = useState(21);
  const [jurisdictions, setJurisdictions] = useState('US,UK,CA');
  const [requireAccredited, setRequireAccredited] = useState(false);

  const handleSetRequirements = async () => {
    if (!signer) return;

    try {
      await setRequirements.mutateAsync({
        minAge,
        jurisdictions: jurisdictions.split(',').map(j => j.trim()),
        requireAccredited,
      });
      alert('Requirements set successfully!');
    } catch (error: any) {
      alert(`Failed to set requirements: ${error.message}`);
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold text-purple-600 mb-4">Protocol Operations</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Age:
          </label>
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(parseInt(e.target.value))}
            min="18"
            max="100"
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Allowed Jurisdictions (comma-separated):
          </label>
          <input
            type="text"
            value={jurisdictions}
            onChange={(e) => setJurisdictions(e.target.value)}
            placeholder="US,UK,CA"
            className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 shadow-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require-accredited"
            checked={requireAccredited}
            onChange={(e) => setRequireAccredited(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="require-accredited" className="ml-2 text-sm text-gray-700">
            Require Accredited Investor
          </label>
        </div>

        <button
          onClick={handleSetRequirements}
          disabled={setRequirements.isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {setRequirements.isLoading ? 'Setting...' : 'Set Requirements'}
        </button>

        {isLoadingRequirements ? (
          <p className="text-sm text-gray-600">Loading requirements...</p>
        ) : requirements ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-semibold text-green-900 mb-2">Current Requirements:</h4>
            <p className="text-sm text-green-800">Min Age: {requirements.minAge}</p>
            <p className="text-sm text-green-800">
              Jurisdictions: {requirements.allowedJurisdictions.join(', ')}
            </p>
            <p className="text-sm text-green-800">
              Require Accredited: {requirements.requireAccredited ? 'Yes' : 'No'}
            </p>
          </div>
        ) : null}

        {isLoadingAccess ? (
          <p className="text-sm text-gray-600">Checking access...</p>
        ) : hasAccess !== undefined ? (
          <div className={`border rounded-md p-4 ${hasAccess ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-sm font-medium ${hasAccess ? 'text-green-800' : 'text-blue-800'}`}>
              User Access: {hasAccess ? '✅ Granted' : '❌ Not Granted'}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

