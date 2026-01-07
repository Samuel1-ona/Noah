import { useState } from 'react';
import { ethers } from 'ethers';
import { jurisdictionStringsToHashes } from 'noah-protocol-sdk';
import { toast } from 'react-toastify';

const VAULT_ABI = [
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function getRequirements() view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
];

export default function SetRequirements({ signer, account, vaultAddress, onRequirementsSet }) {
  const [minAge, setMinAge] = useState(21);
  const [jurisdictions, setJurisdictions] = useState('US,UK,CA');
  const [requireAccredited, setRequireAccredited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetRequirements = async () => {
    if (!vaultAddress || !signer) {
      toast.error('Please connect wallet and enter vault address');
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

      // Convert jurisdictions to hashes (returns decimal strings)
      const jurisdictionHashes = jurisdictionStringsToHashes(jurisdictionList);
      
      // Convert string hashes to BigInt array for contract call
      const jurisdictionBigInts = jurisdictionHashes.map(j => BigInt(j));
      
      // Call vault's setRequirements function directly
      // This will call ProtocolAccessControl.setRequirements() on behalf of the vault
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      
      const tx = await contract.setRequirements(
        minAge,
        jurisdictionBigInts,
        requireAccredited
      );

      toast.info(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      
      // Wait for confirmation
      await tx.wait();
      
      toast.success('Requirements set successfully!');
      
      // Reset form
      setMinAge(21);
      setJurisdictions('US,UK,CA');
      setRequireAccredited(false);

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
    <div className="set-requirements-section">
      <h3>⚙️ Set Vault Requirements</h3>
      <p className="section-description" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
        As the vault owner, set the KYC requirements that users must meet to access the vault.
      </p>

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
            Enter jurisdiction codes separated by commas (e.g., US,UK,CA)
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
        {loading ? 'Setting Requirements...' : 'Set Requirements'}
      </button>
    </div>
  );
}

