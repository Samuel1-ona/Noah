import { useState, useEffect } from 'react';
import { IssuerClient, generateCredentialHash } from 'noah-protocol-sdk';
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
  Stack,
  Divider,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Business,
  AddCircle,
  Block,
  Search,
  ContentCopy,
  AutoAwesome,
} from '@mui/icons-material';

export default function IssuerOperations({ signer, account }) {
  const [issuerClient, setIssuerClient] = useState(null);
  const [credentialHash, setCredentialHash] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState(null);
  
  const [genUserAddress, setGenUserAddress] = useState(account || '');
  const [genAge, setGenAge] = useState(25);
  const [genJurisdiction, setGenJurisdiction] = useState('US');
  const [genAccredited, setGenAccredited] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');

  useEffect(() => {
    if (signer) {
      const client = new IssuerClient(signer, {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
      });
      setIssuerClient(client);
    }
  }, [signer]);

  const handleRegisterCredential = async () => {
    if (!credentialHash || !userAddress) {
      toast.warning('Please enter both credential hash and user address');
      return;
    }

    if (!issuerClient) {
      toast.error('Issuer client not initialized. Please ensure wallet is connected.');
      return;
    }

    try {
      setIsRegistering(true);
      const result = await issuerClient.registerCredential(credentialHash, userAddress, true);
      toast.success(`Credential registered! Transaction: ${result.transactionHash.substring(0, 10)}...`);
      
      // Store the registered credential hash in localStorage for auto-loading
      // Note: We store just the hash here since we don't have metadata when registering manually
      try {
        const registeredCredentials = JSON.parse(localStorage.getItem('registeredCredentials') || '{}');
        if (!registeredCredentials[userAddress]) {
          registeredCredentials[userAddress] = [];
        }
        // Check if credential already exists (as hash string or object)
        const exists = registeredCredentials[userAddress].some(
          cred => (typeof cred === 'string' ? cred : cred.hash) === credentialHash
        );
        if (!exists) {
          registeredCredentials[userAddress].push(credentialHash);
          localStorage.setItem('registeredCredentials', JSON.stringify(registeredCredentials));
          console.log('✅ Saved credential to localStorage for auto-loading');
          
          // Dispatch custom event to notify other components in the same tab
          window.dispatchEvent(new Event('credentialRegistered'));
        }
      } catch (error) {
        console.error('Failed to save credential to localStorage:', error);
      }
      
      setUserAddress('');
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('Not trusted issuer') || errorMessage.includes('Not authorized')) {
        toast.error('⚠️ Your wallet is not authorized as an issuer. Only trusted issuers can register credentials.');
      } else if (errorMessage.includes('already exists')) {
        toast.warning('This credential is already registered.');
      } else {
        toast.error(`Failed to register credential: ${errorMessage}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevokeCredential = async () => {
    if (!credentialHash) {
      toast.warning('Please enter a credential hash');
      return;
    }

    if (!issuerClient) {
      toast.error('Issuer client not initialized. Please ensure wallet is connected.');
      return;
    }

    try {
      setIsRevoking(true);
      const result = await issuerClient.revokeCredential(credentialHash, true);
      toast.success(`Credential revoked! Transaction: ${result.transactionHash.substring(0, 10)}...`);
      setCredentialStatus(null);
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('Not authorized') || errorMessage.includes('Not trusted issuer')) {
        toast.error('⚠️ Your wallet is not authorized as an issuer. Only trusted issuers can revoke credentials.');
      } else {
        toast.error(`Failed to revoke credential: ${errorMessage}`);
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCheckCredential = async () => {
    if (!credentialHash) {
      toast.warning('Please enter a credential hash');
      return;
    }

    try {
      setIsChecking(true);
      const status = await issuerClient.checkCredential(credentialHash);
      setCredentialStatus(status);
      toast.success(`Credential is ${status.isValid ? 'valid' : 'invalid'}${status.isRevoked ? ' and revoked' : ''}`);
    } catch (error) {
      toast.error(`Failed to check credential: ${error.message}`);
      setCredentialStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGenerateHash = () => {
    try {
      if (!genUserAddress) {
        toast.error('Please enter a user address');
        return;
      }

      const result = generateCredentialHash({
        userAddress: genUserAddress,
        age: genAge,
        jurisdiction: genJurisdiction,
        accredited: genAccredited,
      });

      setGeneratedHash(result.credentialHash);
      setCredentialHash(result.credentialHash);
      
      // If generating for the current user's account, save to localStorage for auto-loading with metadata
      if (genUserAddress.toLowerCase() === account?.toLowerCase()) {
        try {
          const registeredCredentials = JSON.parse(localStorage.getItem('registeredCredentials') || '{}');
          if (!registeredCredentials[genUserAddress]) {
            registeredCredentials[genUserAddress] = [];
          }
          // Check if credential already exists
          const exists = registeredCredentials[genUserAddress].some(
            cred => (typeof cred === 'string' ? cred : cred.hash) === result.credentialHash
          );
          if (!exists) {
            // Store credential with metadata for auto-loading
            registeredCredentials[genUserAddress].push({
              hash: result.credentialHash,
              age: genAge,
              jurisdiction: genJurisdiction,
              accredited: genAccredited,
              timestamp: Date.now()
            });
            localStorage.setItem('registeredCredentials', JSON.stringify(registeredCredentials));
            console.log('✅ Saved generated credential with metadata to localStorage for auto-loading');
          }
        } catch (error) {
          console.error('Failed to save generated credential to localStorage:', error);
        }
      }
      
      toast.success('Credential hash generated!');
    } catch (error) {
      toast.error(`Failed to generate hash: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

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
          Issuer Operations
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Register and manage credentials for users. Only trusted issuers can perform these operations.
      </Typography>

      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'action.hover' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesome color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Generate Credential Hash
            </Typography>
          </Box>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="User Address"
              value={genUserAddress}
              onChange={(e) => setGenUserAddress(e.target.value)}
              placeholder="0x..."
            />
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={genAge}
              onChange={(e) => setGenAge(parseInt(e.target.value) || 25)}
              inputProps={{ min: 18, max: 100 }}
            />
            <TextField
              fullWidth
              label="Jurisdiction"
              value={genJurisdiction}
              onChange={(e) => setGenJurisdiction(e.target.value)}
              placeholder="US"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={genAccredited}
                  onChange={(e) => setGenAccredited(e.target.checked)}
                />
              }
              label="Accredited Investor"
            />
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={handleGenerateHash}
              fullWidth
            >
              Generate Credential Hash
            </Button>
            {generatedHash && (
              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  Generated Credential Hash:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                    {generatedHash}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(generatedHash)}
                    color="primary"
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Credential Hash"
          value={credentialHash}
          onChange={(e) => setCredentialHash(e.target.value)}
          placeholder="0x... (or generate above)"
        />

        <TextField
          fullWidth
          label="User Address (for registration)"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="0x..."
        />

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={isRegistering ? <CircularProgress size={20} color="inherit" /> : <AddCircle />}
            onClick={handleRegisterCredential}
            disabled={isRegistering || !issuerClient}
          >
            {isRegistering ? 'Registering...' : 'Register Credential'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={isRevoking ? <CircularProgress size={20} color="inherit" /> : <Block />}
            onClick={handleRevokeCredential}
            disabled={isRevoking || !issuerClient}
          >
            {isRevoking ? 'Revoking...' : 'Revoke Credential'}
          </Button>

          <Button
            variant="outlined"
            startIcon={isChecking ? <CircularProgress size={20} color="inherit" /> : <Search />}
            onClick={handleCheckCredential}
            disabled={isChecking || !issuerClient}
          >
            {isChecking ? 'Checking...' : 'Check Status'}
          </Button>
        </Stack>

        {credentialStatus && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Credential Status
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Hash:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {credentialStatus.credentialHash}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Valid: ${credentialStatus.isValid ? 'Yes' : 'No'}`}
                    color={credentialStatus.isValid ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    label={`Revoked: ${credentialStatus.isRevoked ? 'Yes' : 'No'}`}
                    color={credentialStatus.isRevoked ? 'error' : 'default'}
                    size="small"
                  />
                </Box>
                {credentialStatus.issuer && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Issuer:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {credentialStatus.issuer}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Paper>
  );
}
