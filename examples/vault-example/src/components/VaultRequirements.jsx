import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { jurisdictionStringsToHashes } from 'noah-protocol-sdk';
import { toast } from 'react-toastify';

const VAULT_ABI = [
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function getRequirements() view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
];

export default function VaultRequirements({ signer, account, vaultAddress, onRequirementsSet }) {
  const [minAge, setMinAge] = useState(18);
  const [jurisdictions, setJurisdictions] = useState('US,UK,CA');
  const [requireAccredited, setRequireAccredited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRequirements, setCurrentRequirements] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  // Load current requirements
  const loadRequirements = async () => {
    if (!vaultAddress || !signer) return;

    setLoadingRequirements(true);
    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      const req = await contract.getRequirements();
      
      // Check if requirements are set (minAge > 0 indicates they're set)
      if (req && Number(req.minAge) > 0) {
        setCurrentRequirements({
          minAge: Number(req.minAge),
          allowedJurisdictions: req.allowedJurisdictions.map(j => j.toString()),
          requireAccredited: req.requireAccredited,
        });
      } else {
        setCurrentRequirements(null);
      }
    } catch (error) {
      // Requirements not set yet
      setCurrentRequirements(null);
    } finally {
      setLoadingRequirements(false);
    }
  };

  // Load requirements on mount and when vault address changes
  useEffect(() => {
    loadRequirements();
  }, [vaultAddress, signer]);

  const handleSetRequirements = async () => {
    if (!vaultAddress || !signer) {
      toast.error('Please connect wallet and ensure vault address is set');
      return;
    }

    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Parse jurisdictions
      const jurisdictionList = jurisdictions
        .split(',')
        .map(j => j.trim())
        .filter(j => j.length > 0);

      if (jurisdictionList.length === 0) {
        toast.error('Please enter at least one jurisdiction');
        setLoading(false);
        return;
      }

      if (jurisdictionList.length > 10) {
        toast.error('Maximum 10 jurisdictions allowed');
        setLoading(false);
        return;
      }

      // Convert jurisdictions to hashes
      const jurisdictionHashes = jurisdictionStringsToHashes(jurisdictionList);
      const jurisdictionBigInts = jurisdictionHashes.map(j => BigInt(j));

      // Call vault's setRequirements function
      // This will call ProtocolAccessControl.setRequirements() with msg.sender = vault address
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      
      const tx = await contract.setRequirements(
        minAge,
        jurisdictionBigInts,
        requireAccredited
      );

      toast.info(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      
      // Wait for confirmation
      await tx.wait();
      
      toast.success('Vault requirements set successfully!');
      
      // Reload requirements
      await loadRequirements();

      // Notify parent
      if (onRequirementsSet) {
        onRequirementsSet();
      }
    } catch (error) {
      console.error('Failed to set requirements:', error);
      toast.error(`Failed to set requirements: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!vaultAddress) {
    return null;
  }

  return (
    <div className="vault-requirements-section">
      <h3>⚙️ Set Vault Requirements</h3>
      <p className="section-description" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
        Configure the KYC requirements that users must meet to access this vault.
      </p>

      {loadingRequirements ? (
        <p className="info-text">Loading current requirements...</p>
      ) : currentRequirements ? (
        <div className="current-requirements" style={{
          background: '#f0f9ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#333' }}>Current Requirements:</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Minimum Age:</strong> {currentRequirements.minAge} years
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Allowed Jurisdictions:</strong> {currentRequirements.allowedJurisdictions.length} configured
            </li>
            <li>
              <strong>Requires Accredited:</strong> {currentRequirements.requireAccredited ? 'Yes' : 'No'}
            </li>
          </ul>
        </div>
      ) : (
        <div className="warning-box" style={{ marginBottom: '1.5rem' }}>
          <p>⚠️ No requirements set yet. Set them below to enable KYC verification.</p>
        </div>
      )}

      <div className="form-group">
        <label>
          <strong>Minimum Age:</strong>
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(parseInt(e.target.value) || 18)}
            min="18"
            max="100"
            className="form-input"
            disabled={loading}
          />
        </label>
      </div>

      <div className="form-group">
        <label>
          <strong>Allowed Jurisdictions (comma-separated):</strong>
          <input
            type="text"
            value={jurisdictions}
            onChange={(e) => setJurisdictions(e.target.value)}
            placeholder="US,UK,CA"
            className="form-input"
            disabled={loading}
          />
          <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
            Enter jurisdiction codes separated by commas (e.g., US,UK,CA,DE,FR)
          </small>
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={requireAccredited}
            onChange={(e) => setRequireAccredited(e.target.checked)}
            className="checkbox-input"
            disabled={loading}
          />
          <span>Require Accredited Investor Status</span>
        </label>
      </div>

      <button
        onClick={handleSetRequirements}
        disabled={loading}
        className="button button-primary"
      >
        {loading ? 'Setting Requirements...' : currentRequirements ? 'Update Requirements' : 'Set Requirements'}
      </button>
    </div>
  );
}

