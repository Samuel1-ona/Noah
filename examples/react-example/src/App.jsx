import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ProtocolClient, UserClient, IssuerClient, useProtocol, useUser, generateCredentialHash } from '@noah-protocol/sdk';
import './App.css';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);

  // Connect wallet
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
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  };

  // Check if already connected
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
    <div className="app">
      <header className="app-header">
        <h1>🔐 NOAH SDK - React Example</h1>
        <p>Privacy-Preserving KYC for DeFi</p>
      </header>

      <main className="app-main">
        {!connected ? (
          <div className="connect-section">
            <h2>Connect Your Wallet</h2>
            <p>Connect MetaMask to get started</p>
            <button onClick={connectWallet} className="btn btn-primary">
              Connect MetaMask
            </button>
          </div>
        ) : (
          <>
            <div className="wallet-info">
              <h3>Connected Wallet</h3>
              <p><strong>Address:</strong> {account}</p>
            </div>

            <div className="sections">
              <ProtocolSection signer={signer} account={account} />
              <UserSection signer={signer} account={account} />
              <IssuerSection signer={signer} account={account} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ProtocolSection({ signer, account }) {
  const { 
    requirements, 
    isLoadingRequirements,
    setRequirements,
    hasAccess,
    isLoadingAccess,
  } = useProtocol(signer, {
    protocolAddress: account,
  });

  const [minAge, setMinAge] = useState(21);
  const [jurisdictions, setJurisdictions] = useState('US,UK,CA');
  const [requireAccredited, setRequireAccredited] = useState(false);

  const handleSetRequirements = async () => {
    try {
      await setRequirements.mutateAsync({
        minAge,
        jurisdictions: jurisdictions.split(',').map(j => j.trim()),
        requireAccredited,
      });
      alert('Requirements set successfully!');
    } catch (error) {
      alert(`Failed to set requirements: ${error.message}`);
    }
  };

  return (
    <section className="section">
      <h2>Protocol Operations</h2>
      
      <div className="form-group">
        <label>Minimum Age:</label>
        <input
          type="number"
          value={minAge}
          onChange={(e) => setMinAge(parseInt(e.target.value))}
          min="18"
          max="100"
        />
      </div>

      <div className="form-group">
        <label>Allowed Jurisdictions (comma-separated):</label>
        <input
          type="text"
          value={jurisdictions}
          onChange={(e) => setJurisdictions(e.target.value)}
          placeholder="US,UK,CA"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={requireAccredited}
            onChange={(e) => setRequireAccredited(e.target.checked)}
          />
          Require Accredited Investor
        </label>
      </div>

      <button
        onClick={handleSetRequirements}
        disabled={setRequirements.isLoading}
        className="btn btn-primary"
      >
        {setRequirements.isLoading ? 'Setting...' : 'Set Requirements'}
      </button>

      {isLoadingRequirements ? (
        <p>Loading requirements...</p>
      ) : requirements ? (
        <div className="status-box success">
          <h4>Current Requirements:</h4>
          <p>Min Age: {requirements.minAge}</p>
          <p>Jurisdictions: {requirements.allowedJurisdictions.join(', ')}</p>
          <p>Require Accredited: {requirements.requireAccredited ? 'Yes' : 'No'}</p>
        </div>
      ) : null}

      {isLoadingAccess ? (
        <p>Checking access...</p>
      ) : hasAccess !== undefined ? (
        <div className={`status-box ${hasAccess ? 'success' : 'info'}`}>
          <p>User Access: {hasAccess ? '✅ Granted' : '❌ Not Granted'}</p>
        </div>
      ) : null}
    </section>
  );
}

function UserSection({ signer, account }) {
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
    userAddress: account,
    protocolAddress: protocolAddress || undefined, // Pass protocolAddress to enable query
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  });

  const [generatedProof, setGeneratedProof] = useState(null);

  const handleCheckCredential = async () => {
    if (!credentialHash) {
      alert('Please enter a credential hash');
      return;
    }

    try {
      const isValid = await checkCredentialValidity.mutateAsync(credentialHash);
      alert(isValid ? 'Credential is valid!' : 'Credential is invalid or revoked');
    } catch (error) {
      alert(`Failed to check credential: ${error.message}`);
    }
  };

  const handleGenerateProof = async () => {
    if (!protocolAddress || !credentialHash) {
      alert('Please enter protocol address and credential hash');
      return;
    }

    try {
      // Check if requirements are loading
      if (isLoadingRequirements) {
        alert('Loading requirements, please wait...');
        return;
      }

      // Check if there was an error fetching requirements
      if (requirementsError) {
        alert(`Failed to fetch requirements: ${requirementsError.message}. Please make sure the protocol address is correct and requirements are set.`);
        return;
      }

      // Check if requirements are available
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

      // Store the proof for verification
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
    } catch (error) {
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
        userAddress: account,
      });

      alert(
        `Access granted successfully!\n\n` +
        `Transaction: ${result.transactionHash}\n` +
        `Protocol: ${generatedProof.protocolAddress}\n` +
        `Credential Hash: ${generatedProof.credentialHash}`
      );
      
      // Clear the proof after successful verification
      setGeneratedProof(null);
    } catch (error) {
      alert(`Failed to verify and grant access: ${error.message}`);
    }
  };

  return (
    <section className="section">
      <h2>User Operations</h2>

      <div className="form-group">
        <label>Protocol Address:</label>
        <input
          type="text"
          value={protocolAddress}
          onChange={(e) => setProtocolAddress(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div className="form-group">
        <label>Credential Hash:</label>
        <input
          type="text"
          value={credentialHash}
          onChange={(e) => setCredentialHash(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div className="form-group">
        <label>Age:</label>
        <input
          type="number"
          value={credentialAge}
          onChange={(e) => setCredentialAge(parseInt(e.target.value))}
          min="18"
          max="100"
        />
      </div>

      <div className="form-group">
        <label>Jurisdiction:</label>
        <input
          type="text"
          value={credentialJurisdiction}
          onChange={(e) => setCredentialJurisdiction(e.target.value)}
          placeholder="US"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={credentialAccredited}
            onChange={(e) => setCredentialAccredited(e.target.checked)}
          />
          Accredited Investor
        </label>
      </div>

      <button
        onClick={handleCheckCredential}
        disabled={checkCredentialValidity.isLoading}
        className="btn btn-secondary"
      >
        {checkCredentialValidity.isLoading ? 'Checking...' : 'Check Credential'}
      </button>

      <button
        onClick={handleGenerateProof}
        disabled={generateProof.isLoading}
        className="btn btn-primary"
      >
        {generateProof.isLoading ? 'Generating...' : 'Generate Proof'}
      </button>

      {generatedProof && (
        <button
          onClick={handleVerifyAndGrantAccess}
          disabled={verifyAndGrantAccess.isLoading}
          className="btn btn-primary"
        >
          {verifyAndGrantAccess.isLoading ? 'Verifying...' : 'Verify & Grant Access'}
        </button>
      )}

      {isLoadingRequirements && <p>Loading protocol requirements...</p>}
    </section>
  );
}

function IssuerSection({ signer, account }) {
  const [issuerClient, setIssuerClient] = useState(null);
  const [credentialHash, setCredentialHash] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  
  // Credential hash generator fields
  const [genUserAddress, setGenUserAddress] = useState(account || '');
  const [genAge, setGenAge] = useState(25);
  const [genJurisdiction, setGenJurisdiction] = useState('US');
  const [genAccredited, setGenAccredited] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');

  useEffect(() => {
    if (signer) {
      const client = new IssuerClient(signer, {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
      });
      setIssuerClient(client);
    }
  }, [signer]);

  const handleRegisterCredential = async () => {
    if (!credentialHash || !userAddress) {
      setMessage('Please enter both credential hash and user address');
      setMessageType('error');
      return;
    }

    const hashToRegister = credentialHash; // Save before clearing

    try {
      setIsRegistering(true);
      setMessage(null);
      const result = await issuerClient.registerCredential(credentialHash, userAddress, true);
      setMessage(
        `Credential registered successfully!\n` +
        `Credential Hash: ${hashToRegister}\n` +
        `Transaction: ${result.transactionHash}`
      );
      setMessageType('success');
      // Keep credentialHash visible so user can see it
      setUserAddress('');
    } catch (error) {
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

    const hashToRevoke = credentialHash; // Save before clearing

    try {
      setIsRevoking(true);
      setMessage(null);
      const result = await issuerClient.revokeCredential(credentialHash, true);
      setMessage(
        `Credential revoked successfully!\n` +
        `Credential Hash: ${hashToRevoke}\n` +
        `Transaction: ${result.transactionHash}`
      );
      setMessageType('success');
      // Keep credentialHash visible so user can see it
      setCredentialStatus(null);
    } catch (error) {
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
      const status = await issuerClient.checkCredential(credentialHash);
      setCredentialStatus(status);
      setMessage(`Credential is ${status.isValid ? 'valid' : 'invalid'}${status.isRevoked ? ' and revoked' : ''}`);
      setMessageType(status.isValid && !status.isRevoked ? 'success' : 'error');
    } catch (error) {
      setMessage(`Failed to check credential: ${error.message}`);
      setMessageType('error');
      setCredentialStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

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
        `Credential hash generated!\n` +
        `Hash: ${result.credentialHash}\n` +
        `Jurisdiction Hash: ${result.jurisdictionHash}`
      );
      setMessageType('success');
    } catch (error) {
      setMessage(`Failed to generate hash: ${error.message}`);
      setMessageType('error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('Copied to clipboard!');
      setMessageType('success');
      setTimeout(() => setMessage(null), 2000);
    }).catch(() => {
      setMessage('Failed to copy');
      setMessageType('error');
    });
  };

  return (
    <section className="section">
      <h2>Issuer Operations</h2>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '6px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '1.1em' }}>Generate Credential Hash</h3>
        <div className="form-group">
          <label>User Address:</label>
          <input
            type="text"
            value={genUserAddress}
            onChange={(e) => setGenUserAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Age:</label>
          <input
            type="number"
            value={genAge}
            onChange={(e) => setGenAge(parseInt(e.target.value))}
            min="18"
            max="100"
          />
        </div>
        <div className="form-group">
          <label>Jurisdiction:</label>
          <input
            type="text"
            value={genJurisdiction}
            onChange={(e) => setGenJurisdiction(e.target.value)}
            placeholder="US"
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={genAccredited}
              onChange={(e) => setGenAccredited(e.target.checked)}
            />
            Accredited Investor
          </label>
        </div>
        <button
          onClick={handleGenerateHash}
          className="btn btn-primary"
        >
          Generate Credential Hash
        </button>
        {generatedHash && (
          <div className="status-box success" style={{ marginTop: '15px' }}>
            <h4>Generated Credential Hash:</h4>
            <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.9em' }}>
              {generatedHash}
            </p>
            <button
              onClick={() => copyToClipboard(generatedHash)}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Copy Hash
            </button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Credential Hash:</label>
        <input
          type="text"
          value={credentialHash}
          onChange={(e) => setCredentialHash(e.target.value)}
          placeholder="0x... (or generate above)"
        />
      </div>

      <div className="form-group">
        <label>User Address (for registration):</label>
        <input
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <button
        onClick={handleRegisterCredential}
        disabled={isRegistering || !issuerClient}
        className="btn btn-primary"
      >
        {isRegistering ? 'Registering...' : 'Register Credential'}
      </button>

      <button
        onClick={handleRevokeCredential}
        disabled={isRevoking || !issuerClient}
        className="btn btn-secondary"
      >
        {isRevoking ? 'Revoking...' : 'Revoke Credential'}
      </button>

      <button
        onClick={handleCheckCredential}
        disabled={isChecking || !issuerClient}
        className="btn btn-secondary"
      >
        {isChecking ? 'Checking...' : 'Check Credential Status'}
      </button>

      {message && (
        <div className={`status-box ${messageType}`}>
          <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
        </div>
      )}

      {credentialStatus && (
        <div className="status-box info">
          <h4>Credential Status:</h4>
          <p>Hash: {credentialStatus.credentialHash}</p>
          <p>Valid: {credentialStatus.isValid ? 'Yes' : 'No'}</p>
          <p>Revoked: {credentialStatus.isRevoked ? 'Yes' : 'No'}</p>
          {credentialStatus.issuer && <p>Issuer: {credentialStatus.issuer}</p>}
        </div>
      )}
    </section>
  );
}

export default App;

