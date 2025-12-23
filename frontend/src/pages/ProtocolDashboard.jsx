import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import walletService from '../services/walletService';
import { protocolService } from '../services/apiClient';
import { CONTRACT_ADDRESSES } from '../config/constants';
import { parseJurisdictions } from '../utils/jurisdiction';

function ProtocolDashboard() {
  const [minAge, setMinAge] = useState('');
  const [jurisdictions, setJurisdictions] = useState('');
  const [requireAccredited, setRequireAccredited] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hashedJurisdictions, setHashedJurisdictions] = useState(null);
  const [originalJurisdictions, setOriginalJurisdictions] = useState(null);
  const [requirementsHash, setRequirementsHash] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [account, setAccount] = useState(() => walletService.getAccount());

  const protocolAddress = account || CONTRACT_ADDRESSES.ProtocolAccessControl;

  // Get current requirements
  const { data: currentRequirements, refetch: refetchRequirements } = useQuery({
    queryKey: ['protocol-requirements', protocolAddress],
    queryFn: () => protocolService.getRequirements(protocolAddress),
    enabled: !!protocolAddress && protocolAddress.length === 42,
  });

  // Monitor account changes and update screen when wallet connects
  React.useEffect(() => {
    // Set initial account state
    const currentAccount = walletService.getAccount();
    if (currentAccount !== account) {
      setAccount(currentAccount);
    }

    // Subscribe to wallet state changes
    const unsubscribe = walletService.onStateChange(({ account: newAccount, connected }) => {
      // Update account state to trigger re-render
      setAccount(newAccount);
      
      // When wallet connects or account changes, refetch requirements
      if (connected && newAccount) {
        // Update protocol address if it was using fallback
        const newProtocolAddress = newAccount || CONTRACT_ADDRESSES.ProtocolAccessControl;
        // Refetch requirements to update the screen
        if (newProtocolAddress && newProtocolAddress.length === 42) {
          refetchRequirements();
        }
      } else if (!connected && !newAccount) {
        // Wallet disconnected - clear state
        setError(null);
        setSuccess(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [account, refetchRequirements]);

  // Set requirements mutation
  const setRequirementsMutation = useMutation({
    mutationFn: async (data) => {
      // Extract metadata before sending
      const { _originalJurisdictions, _hashedJurisdictions, ...requestData } = data;
      return protocolService.setRequirements(requestData);
    },
    onSuccess: (data, variables) => {
      setSuccess(`Requirements set! Transaction: ${data.transactionHash}`);
      setError(null);
      // Store the hashed jurisdictions, original list, and requirements hash for display
      if (variables._originalJurisdictions && variables._hashedJurisdictions) {
        setOriginalJurisdictions(variables._originalJurisdictions);
        setHashedJurisdictions(variables._hashedJurisdictions);
      }
      if (variables._requirementsHash) {
        setRequirementsHash(variables._requirementsHash);
      }
      refetchRequirements();
    },
    onError: (err) => {
      // Extract detailed error message
      let errorMessage = err.message;
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (errorData.validationErrors) {
          errorMessage = `Validation errors: ${errorData.validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      setError(errorMessage);
      setSuccess(null);
      console.error('Set requirements error:', err);
    },
  });

  const handleSetRequirements = () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!minAge) {
      setError('Please provide minimum age');
      return;
    }

    // Parse and convert jurisdiction strings to hashes
    let allowedJurisdictions;
    let originalJurisdictionList = [];
    try {
      // Get original jurisdiction list (before hashing)
      originalJurisdictionList = jurisdictions
        .split(',')
        .map((j) => j.trim())
        .filter((j) => j.length > 0);
      
      allowedJurisdictions = parseJurisdictions(jurisdictions);
      if (allowedJurisdictions.length === 0 && jurisdictions.trim().length > 0) {
        setError('Please enter at least one valid jurisdiction');
        return;
      }
    } catch (err) {
      setError(`Error parsing jurisdictions: ${err.message}`);
      return;
    }

    setError(null);
    setSuccess(null);

    // Convert hash values for the API
    // Strategy: 
    // 1. If hash is a small number (from manual input), send as number
    // 2. If hash is a large string (from jurisdiction conversion), try sending as hex string
    //    (backend validator accepts hex strings, and backend can convert to BigInt)
    const jurisdictionsForAPI = allowedJurisdictions.map((hash) => {
      const hashStr = String(hash);
      
      // Check if it's already a hex string
      if (/^0x[a-fA-F0-9]+$/.test(hashStr)) {
        return hashStr; // Send hex as-is
      }
      
      // Verify it's a valid numeric string
      if (!/^\d+$/.test(hashStr)) {
        throw new Error(`Invalid jurisdiction hash format: ${hashStr}`);
      }
      
      // Try to convert to number if it's within safe integer range
      const num = Number(hashStr);
      
      // If it's a safe integer, send as number (this works with current backend!)
      if (Number.isSafeInteger(num)) {
        return num;
      }
      
      // For very large values, convert back to hex format
      // This ensures the backend validator accepts it (hex strings are accepted)
      // The backend will convert hex to BigInt
      try {
        const bigIntValue = BigInt(hashStr);
        const hexValue = '0x' + bigIntValue.toString(16);
        console.log(`Converting large hash to hex: ${hashStr.substring(0, 20)}... → ${hexValue.substring(0, 30)}...`);
        return hexValue;
      } catch (err) {
        // Fallback: send as string and hope backend accepts it
        console.warn('Could not convert to hex, sending as string:', err);
        return hashStr;
      }
    });

    // Ensure protocolAddress is valid
    if (!protocolAddress || protocolAddress.length !== 42) {
      setError('Invalid protocol address. Please connect your wallet.');
      return;
    }

    // Compute requirements hash (combines all requirements)
    const reqHash = computeRequirementsHash(
      parseInt(minAge, 10),
      allowedJurisdictions.map(h => String(h)),
      requireAccredited
    );

    const requestData = {
      protocolAddress,
      minAge: parseInt(minAge, 10),
      allowedJurisdictions: jurisdictionsForAPI,
      requireAccredited,
      // Store original and hashed for display after success
      _originalJurisdictions: originalJurisdictionList,
      _hashedJurisdictions: allowedJurisdictions.map(h => String(h)),
      _requirementsHash: reqHash,
    };

    console.log('Sending requirements:', {
      protocolAddress: requestData.protocolAddress,
      minAge: requestData.minAge,
      requireAccredited: requestData.requireAccredited,
      allowedJurisdictionsCount: requestData.allowedJurisdictions.length,
      allowedJurisdictions: requestData.allowedJurisdictions.map((j, idx) => ({
        index: idx,
        value: String(j).substring(0, 50) + (String(j).length > 50 ? '...' : ''),
        fullValue: String(j),
        type: typeof j,
        isString: typeof j === 'string',
        length: String(j).length,
        isNumericString: typeof j === 'string' && /^\d+$/.test(j),
      })),
    });

    setRequirementsMutation.mutate(requestData);
  };

  const handleCopyHash = async (hash, index) => {
    try {
      await navigator.clipboard.writeText(String(hash));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyAllHashes = async () => {
    if (!hashedJurisdictions || hashedJurisdictions.length === 0) return;
    const allHashes = hashedJurisdictions.map(h => String(h)).join(', ');
    try {
      await navigator.clipboard.writeText(allHashes);
      setCopiedIndex('all');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const computeRequirementsHash = (minAge, jurisdictions, requireAccredited) => {
    // Create a deterministic string representation of all requirements
    // Format: minAge:value,jurisdictions:hash1,hash2,...,accredited:0|1
    const jurisdictionsStr = jurisdictions.map(j => String(j)).join(',');
    const accreditedValue = requireAccredited ? 1 : 0;
    const requirementsData = `minAge:${minAge},jurisdictions:${jurisdictionsStr},accredited:${accreditedValue}`;
    
    // Hash using keccak256 (same as credential hashing)
    const hash = ethers.keccak256(ethers.toUtf8Bytes(requirementsData));
    return hash;
  };

  const handleCopyRequirementsHash = async () => {
    if (!requirementsHash) return;
    try {
      await navigator.clipboard.writeText(requirementsHash);
      setCopiedIndex('requirements');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!account) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">Please connect your MetaMask wallet to continue.</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Protocol Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Connected: {account}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Protocol Address: {protocolAddress}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Current Requirements */}
        {currentRequirements && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Requirements
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  <Chip label={`Min Age: ${currentRequirements.minAge}`} />
                  <Chip
                    label={`Require Accredited: ${currentRequirements.requireAccredited ? 'Yes' : 'No'}`}
                  />
                  <Chip
                    label={`Jurisdictions: ${currentRequirements.allowedJurisdictions?.length || 0}`}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Set Requirements */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Set Protocol Requirements
              </Typography>
              <TextField
                fullWidth
                label="Minimum Age"
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Allowed Jurisdictions (comma-separated)"
                value={jurisdictions}
                onChange={(e) => setJurisdictions(e.target.value)}
                placeholder="US, UK, CA, DE, FR"
                helperText="Enter jurisdiction codes (e.g., US, UK, CA) or hash numbers separated by commas. Strings will be automatically converted to hashes."
                sx={{ mb: 2 }}
              />
              {jurisdictions && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Preview:</strong> {jurisdictions.split(',').map((j) => j.trim()).filter((j) => j.length > 0).join(', ')}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    These will be converted to hash numbers before submission.
                  </Typography>
                </Alert>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requireAccredited}
                    onChange={(e) => setRequireAccredited(e.target.checked)}
                  />
                }
                label="Require Accredited Investor Status"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSetRequirements}
                disabled={setRequirementsMutation.isPending || !minAge}
                fullWidth
              >
                {setRequirementsMutation.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Setting Requirements...
                  </>
                ) : (
                  'Set Requirements'
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Messages */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}
        {success && (
          <Grid item xs={12}>
            <Alert 
              severity="success" 
              onClose={() => {
                setSuccess(null);
                setHashedJurisdictions(null);
                setOriginalJurisdictions(null);
                setRequirementsHash(null);
              }}
            >
              {success}
            </Alert>
          </Grid>
        )}

        {/* Requirements Hash Display */}
        {requirementsHash && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                    Requirements Hash
                  </Typography>
                  <Tooltip title={copiedIndex === 'requirements' ? 'Copied!' : 'Copy requirements hash'}>
                    <IconButton 
                      onClick={handleCopyRequirementsHash}
                      color="inherit"
                      size="small"
                      sx={{ color: 'inherit' }}
                    >
                      {copiedIndex === 'requirements' ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" sx={{ mb: 1, color: 'inherit', opacity: 0.9 }}>
                  This hash represents all requirements combined (minAge, jurisdictions, accredited status)
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <code style={{ 
                    wordBreak: 'break-all', 
                    fontSize: '0.875rem',
                    color: 'inherit'
                  }}>
                    {requirementsHash}
                  </code>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Hashed Jurisdictions Display */}
        {hashedJurisdictions && hashedJurisdictions.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Individual Jurisdiction Hashes
                  </Typography>
                  <Tooltip title={copiedIndex === 'all' ? 'Copied!' : 'Copy all jurisdiction hashes'}>
                    <IconButton 
                      onClick={handleCopyAllHashes}
                      color={copiedIndex === 'all' ? 'success' : 'default'}
                      size="small"
                    >
                      {copiedIndex === 'all' ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Original input: <strong>{originalJurisdictions?.join(', ') || jurisdictions}</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {originalJurisdictions?.map((original, index) => {
                    const hash = hashedJurisdictions[index];
                    if (!hash) return null;
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                          <strong>{original}:</strong>{' '}
                          <code style={{ 
                            wordBreak: 'break-all', 
                            fontSize: '0.875rem',
                            color: 'primary.main'
                          }}>
                            {String(hash)}
                          </code>
                        </Typography>
                        <Tooltip title={copiedIndex === index ? 'Copied!' : 'Copy hash'}>
                          <IconButton
                            onClick={() => handleCopyHash(hash, index)}
                            color={copiedIndex === index ? 'success' : 'default'}
                            size="small"
                          >
                            {copiedIndex === index ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  These are the individual jurisdiction hashes that were sent to the smart contract. You can copy individual hashes or all of them at once.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default ProtocolDashboard;

