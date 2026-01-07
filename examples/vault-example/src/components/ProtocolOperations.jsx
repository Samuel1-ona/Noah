import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { jurisdictionStringsToHashes } from 'noah-protocol-sdk';
import { toast } from 'react-toastify';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
} from '@mui/material';
import { Settings, CheckCircle } from '@mui/icons-material';

const VAULT_ABI = [
  'function setRequirements(uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
  'function getRequirements() view returns (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited)',
];

export default function ProtocolOperations({ signer, account, vaultAddress, onRequirementsSet }) {
  const [minAge, setMinAge] = useState(18);
  const [jurisdictions, setJurisdictions] = useState('US,UK,CA');
  const [requireAccredited, setRequireAccredited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRequirements, setCurrentRequirements] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  const loadRequirements = async () => {
    if (!vaultAddress || !signer) return;

    setLoadingRequirements(true);
    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      const req = await contract.getRequirements();
      
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
      setCurrentRequirements(null);
    } finally {
      setLoadingRequirements(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, [vaultAddress, signer]);

  const handleSetRequirements = async () => {
    if (!vaultAddress || !signer || !account) {
      toast.error('Please connect wallet and ensure vault address is set');
      return;
    }

    setLoading(true);
    try {
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

      const jurisdictionHashes = jurisdictionStringsToHashes(jurisdictionList);
      const jurisdictionBigInts = jurisdictionHashes.map(j => BigInt(j));

      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      
      const tx = await contract.setRequirements(
        minAge,
        jurisdictionBigInts,
        requireAccredited
      );

      toast.info(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();
      toast.success('Vault requirements set successfully!');
      
      await loadRequirements();
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
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Settings color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Protocol Operations
          </Typography>
        </Box>
        <Alert severity="info">Vault address required to set requirements.</Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar
          src="/noah-logo.png"
          alt="Noah Logo"
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
          }}
          variant="rounded"
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Protocol Operations
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the KYC requirements that users must meet to access this vault.
      </Typography>

      {loadingRequirements ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading current requirements...</Typography>
        </Box>
      ) : currentRequirements ? (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
              Current Requirements
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Min Age: ${currentRequirements.minAge}`} size="small" />
              <Chip label={`Jurisdictions: ${currentRequirements.allowedJurisdictions.length}`} size="small" />
              <Chip 
                label={`Accredited: ${currentRequirements.requireAccredited ? 'Required' : 'Not Required'}`} 
                size="small"
                color={currentRequirements.requireAccredited ? 'warning' : 'default'}
              />
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No requirements set yet. Set them below to enable KYC verification.
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Minimum Age"
          type="number"
          value={minAge}
          onChange={(e) => setMinAge(parseInt(e.target.value) || 18)}
          inputProps={{ min: 18, max: 100 }}
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Allowed Jurisdictions (comma-separated)"
          value={jurisdictions}
          onChange={(e) => setJurisdictions(e.target.value)}
          placeholder="US,UK,CA"
          disabled={loading}
          helperText="Enter jurisdiction codes separated by commas (e.g., US,UK,CA,DE,FR)"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={requireAccredited}
              onChange={(e) => setRequireAccredited(e.target.checked)}
              disabled={loading}
            />
          }
          label="Require Accredited Investor Status"
        />

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
          onClick={handleSetRequirements}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Setting Requirements...' : currentRequirements ? 'Update Requirements' : 'Set Requirements'}
        </Button>
      </Stack>
    </Paper>
  );
}
