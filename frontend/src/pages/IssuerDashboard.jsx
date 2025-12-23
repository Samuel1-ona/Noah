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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import walletService from '../services/walletService';
import { issuerService } from '../services/apiClient';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function IssuerDashboard() {
  const [credentialHash, setCredentialHash] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [account, setAccount] = useState(() => walletService.getAccount());

  // Get issuer's credentials
  const { data: issuerCredentials, isLoading: loadingIssuerCredentials, refetch: refetchIssuerCredentials } = useQuery({
    queryKey: ['issuer-credentials', account],
    queryFn: () => issuerService.getIssuerCredentials(account),
    enabled: !!account,
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
      
      // When wallet connects or account changes, refetch credentials
      if (connected && newAccount) {
        // Refetch credentials to update the screen
        refetchIssuerCredentials();
      } else if (!connected && !newAccount) {
        // Wallet disconnected - clear state
        setError(null);
        setSuccess(null);
        setCredentialHash('');
        setUserAddress('');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [account, refetchIssuerCredentials]);

  // Register credential mutation
  const registerMutation = useMutation({
    mutationFn: async ({ credentialHash, userAddress }) => {
      return issuerService.registerCredential(credentialHash, userAddress);
    },
    onSuccess: (data) => {
      setSuccess(`Credential registered! Transaction: ${data.transactionHash}`);
      setError(null);
      setCredentialHash('');
      setUserAddress('');
      refetchIssuerCredentials(); // Refresh the credentials list
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
          // Handle specific blockchain errors with user-friendly messages
          if (errorMessage.includes('Credential already exists')) {
            errorMessage = 'This credential is already registered. If you want to register it again, please use a different credential hash.';
          } else if (errorMessage.includes('Not trusted issuer')) {
            errorMessage = 'Your address is not registered as a trusted issuer. Please contact the protocol administrator.';
          }
        }
      }
      setError(errorMessage);
      setSuccess(null);
      console.error('Register credential error:', err);
    },
  });

  // Revoke credential mutation
  const revokeMutation = useMutation({
    mutationFn: async (credentialHash) => {
      return issuerService.revokeCredential(credentialHash);
    },
    onSuccess: (data) => {
      setSuccess(`Credential revoked! Transaction: ${data.transactionHash}`);
      setError(null);
      refetchIssuerCredentials(); // Refresh the credentials list
    },
    onError: (err) => {
      setError(err.message);
      setSuccess(null);
    },
  });

  // Check credential status
  const [checkHash, setCheckHash] = useState('');
  const { data: credentialStatus, refetch: checkCredential } = useQuery({
    queryKey: ['credential-status', checkHash],
    queryFn: () => contractClient.isCredentialValid(checkHash),
    enabled: false, // Manual trigger
  });

  const handleRegister = () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!credentialHash || !userAddress) {
      setError('Please provide both credential hash and user address');
      return;
    }

    // Validate credential hash format (must be 0x followed by 64 hex characters)
    const hashPattern = /^0x[a-fA-F0-9]{64}$/;
    if (!hashPattern.test(credentialHash)) {
      setError('Credential hash must be a valid 32-byte hash (0x followed by 64 hex characters)');
      return;
    }

    // Validate user address format
    const addressPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!addressPattern.test(userAddress)) {
      setError('User address must be a valid Ethereum address (0x followed by 40 hex characters)');
      return;
    }

    setError(null);
    setSuccess(null);

    registerMutation.mutate({ credentialHash, userAddress });
  };

  const handleRevoke = (hash) => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!hash) {
      setError('Please provide credential hash');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke credential ${hash}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    revokeMutation.mutate(hash);
  };

  const handleCheckCredential = () => {
    if (!checkHash) {
      setError('Please enter a credential hash to check');
      return;
    }
    checkCredential();
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
        Issuer Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Connected: {account}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* My Issued Credentials */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Issued Credentials
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                All credentials you have registered. Click on a credential to copy its hash.
              </Typography>
              {loadingIssuerCredentials ? (
                <CircularProgress size={24} />
              ) : issuerCredentials && issuerCredentials.length > 0 ? (
                <List>
                  {issuerCredentials.map((credential, index) => (
                    <React.Fragment key={credential.credential_hash || index}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                        onClick={() => {
                          setCredentialHash(credential.credential_hash);
                          setSuccess(`Credential hash copied: ${credential.credential_hash}`);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                {credential.credential_hash}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<ContentCopyIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(credential.credential_hash);
                                  setSuccess('Credential hash copied to clipboard!');
                                }}
                              >
                                Copy
                              </Button>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={credential.status || 'active'}
                                size="small"
                                color={credential.status === 'active' ? 'success' : 'default'}
                              />
                              <Typography variant="caption" color="text.secondary">
                                User: {credential.user_address?.slice(0, 10)}...
                              </Typography>
                              {credential.created_at && (
                                <Typography variant="caption" color="text.secondary">
                                  Created: {new Date(credential.created_at).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < issuerCredentials.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No credentials found. Register a credential to get started.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Register Credential */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Register Credential
              </Typography>
              <TextField
                fullWidth
                label="Credential Hash"
                value={credentialHash}
                onChange={(e) => setCredentialHash(e.target.value)}
                placeholder="0x000000000000000000000000000000000000000000000000000000024cb016ea"
                helperText="Must be a 32-byte hash (0x followed by 64 hex characters)"
                sx={{ mb: 2 }}
                error={!!(credentialHash && !/^0x[a-fA-F0-9]{64}$/.test(credentialHash))}
              />
              <TextField
                fullWidth
                label="User Address"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0xd5881aa749eefd3cb08d10f051ac776d664d0663"
                helperText="Must be a valid Ethereum address (0x followed by 40 hex characters)"
                sx={{ mb: 2 }}
                error={!!(userAddress && !/^0x[a-fA-F0-9]{40}$/.test(userAddress))}
              />
              <Button
                variant="contained"
                onClick={handleRegister}
                disabled={registerMutation.isPending || !credentialHash || !userAddress}
                fullWidth
              >
                {registerMutation.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Registering...
                  </>
                ) : (
                  'Register Credential'
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Check Credential Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Check Credential Status
              </Typography>
              <TextField
                fullWidth
                label="Credential Hash"
                value={checkHash}
                onChange={(e) => setCheckHash(e.target.value)}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleCheckCredential}
                disabled={!checkHash}
                fullWidth
                sx={{ mb: 2 }}
              >
                Check Status
              </Button>
              {credentialStatus !== undefined && (
                <Alert
                  severity={credentialStatus ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {credentialStatus
                    ? 'Credential is valid'
                    : 'Credential is invalid or revoked'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Revoke Credential */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revoke Credential
              </Typography>
              <TextField
                fullWidth
                label="Credential Hash"
                value={credentialHash}
                onChange={(e) => setCredentialHash(e.target.value)}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="error"
                onClick={() => handleRevoke(credentialHash)}
                disabled={revokeMutation.isPending || !credentialHash}
                fullWidth
              >
                {revokeMutation.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Revoking...
                  </>
                ) : (
                  'Revoke Credential'
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

export default IssuerDashboard;

