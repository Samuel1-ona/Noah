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
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
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

  const account = walletService.getAccount();
  const protocolAddress = account || CONTRACT_ADDRESSES.ProtocolAccessControl;

  // Get current requirements
  const { data: currentRequirements, refetch: refetchRequirements } = useQuery({
    queryKey: ['protocol-requirements', protocolAddress],
    queryFn: () => protocolService.getRequirements(protocolAddress),
    enabled: !!protocolAddress && protocolAddress.length === 42,
  });

  // Set requirements mutation
  const setRequirementsMutation = useMutation({
    mutationFn: async (data) => {
      return protocolService.setRequirements(data);
    },
    onSuccess: (data) => {
      setSuccess(`Requirements set! Transaction: ${data.transactionHash}`);
      setError(null);
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
    try {
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

    const requestData = {
      protocolAddress,
      minAge: parseInt(minAge, 10),
      allowedJurisdictions: jurisdictionsForAPI,
      requireAccredited,
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
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default ProtocolDashboard;

