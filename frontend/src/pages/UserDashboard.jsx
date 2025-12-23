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
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import walletService from '../services/walletService';
import { proofService, protocolService, userService } from '../services/apiClient';
import { jurisdictionStringToHash } from '../utils/jurisdiction';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function UserDashboard() {
  const [credentialHash, setCredentialHash] = useState('');
  const [protocolAddress, setProtocolAddress] = useState('');
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [proofResult, setProofResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCredentialData, setManualCredentialData] = useState({
    age: '',
    jurisdiction: '',
    accredited: 0,
  });

  const [account, setAccount] = useState(() => walletService.getAccount());

  // Get user's credentials
  const { data: userCredentials, isLoading: loadingCredentials, refetch: refetchCredentials } = useQuery({
    queryKey: ['user-credentials', account],
    queryFn: () => userService.getCredentials(account),
    enabled: !!account,
  });

  // Get protocol requirements
  const { data: requirements, isLoading: loadingRequirements, refetch: refetchRequirements } = useQuery({
    queryKey: ['protocol-requirements', protocolAddress],
    queryFn: () => protocolService.getRequirements(protocolAddress),
    enabled: !!protocolAddress && protocolAddress.length === 42,
  });

  // Check access status
  const { data: accessStatus, refetch: refetchAccessStatus } = useQuery({
    queryKey: ['access-status', protocolAddress, account],
    queryFn: () => userService.checkAccess(protocolAddress, account),
    enabled: !!protocolAddress && !!account && protocolAddress.length === 42,
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
      
      // When wallet connects or account changes, refetch all queries
      if (connected && newAccount) {
        // Refetch all queries to update the screen
        refetchCredentials();
        if (protocolAddress && protocolAddress.length === 42) {
          refetchRequirements();
          refetchAccessStatus();
        }
      } else if (!connected && !newAccount) {
        // Wallet disconnected - clear state
        setError(null);
        setSuccess(null);
        setProofResult(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [account, protocolAddress, refetchCredentials, refetchRequirements, refetchAccessStatus]);

  // Generate proof mutation
  const generateProofMutation = useMutation({
    mutationFn: async (data) => {
      return proofService.generateProof(data);
    },
    onSuccess: (data) => {
      setProofResult(data);
      setSuccess('Proof generated successfully!');
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      setSuccess(null);
    },
  });

  // Verify proof mutation
  const verifyProofMutation = useMutation({
    mutationFn: async (data) => {
      return protocolService.verifyAccess(data);
    },
    onSuccess: (data) => {
      setSuccess(`Access granted! Transaction: ${data.transactionHash}`);
      setError(null);
      setProofResult(null); // Clear proof after successful verification
    },
    onError: (err) => {
      setError(err.message);
      setSuccess(null);
    },
  });

  const handleGenerateProof = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!credentialHash || !protocolAddress) {
      setError('Please provide credential hash and protocol address');
      return;
    }

    // Validate credential hash format
    const hashPattern = /^0x[a-fA-F0-9]{64}$/;
    if (!hashPattern.test(credentialHash)) {
      setError('Invalid credential hash format. Must be 0x followed by 64 hex characters.');
      return;
    }

    if (!requirements) {
      setError('Please check protocol requirements first');
      return;
    }

    setError(null);
    setSuccess(null);

    let credential = selectedCredential || userCredentials?.find(
      (c) => c.credential_hash === credentialHash
    );

    // If credential not found in local list, try to fetch from backend
    if (!credential) {
      try {
        setSuccess('Fetching credential data...');
        const response = await userService.getCredentialByHash(credentialHash);
        credential = response;
      } catch (err) {
        // Check if error response has detailed information
        // Try multiple ways to access the error data (axios interceptor might transform it)
        const errorResponse = err.response?.data || err.responseData;
        const errorData = errorResponse?.error;
        
        console.log('Error fetching credential:', {
          status: err.status || err.response?.status,
          errorResponse,
          errorData,
          fullError: err
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.jsx:141',message:'Error caught in credential fetch',data:{status:err.status||err.response?.status,hasErrorResponse:!!errorResponse,hasErrorData:!!errorData,existsOnChain:errorData?.existsOnChain,errorDataKeys:errorData?Object.keys(errorData):[],errorResponseKeys:errorResponse?Object.keys(errorResponse):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion agent log
        
        // Check if credential exists on-chain (status 404 with existsOnChain flag)
        const is404 = err.status === 404 || err.response?.status === 404;
        const shouldShowManual = is404 && errorData?.existsOnChain;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.jsx:154',message:'Condition evaluation for manual entry',data:{is404,existsOnChain:errorData?.existsOnChain,shouldShowManual,currentShowManualEntry:showManualEntry},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion agent log
        
        if (shouldShowManual) {
          // Credential exists on-chain but not in database - show manual entry form
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.jsx:160',message:'Setting showManualEntry to true',data:{before:showManualEntry},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
          // #endregion agent log
          setError(
            `Credential found on-chain but data not available. ` +
            `Please enter the credential data manually below, or contact the issuer to register it in the database.`
          );
          setShowManualEntry(true);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.jsx:168',message:'After setShowManualEntry(true)',data:{errorSet:true},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
          // #endregion agent log
          return; // Don't proceed, wait for manual entry
        } else if (is404) {
          // Credential doesn't exist on-chain
          setError(
            `Credential not found. The credential hash is not registered on-chain. ` +
            `Please ensure the credential has been registered by an issuer using the Issuer Dashboard.`
          );
          setShowManualEntry(false);
          return;
        } else {
          setError(`Failed to fetch credential: ${err.message || errorData?.message || 'Unknown error'}`);
          setShowManualEntry(false);
          return;
        }
      }
    }

    // Check if credential data is incomplete (exists but missing required fields)
    const isDataIncomplete = credential && (!credential.age || !credential.jurisdiction || credential.accredited === null || credential.accredited === undefined);
    
    if (isDataIncomplete && !showManualEntry) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.jsx:196',message:'Credential data is incomplete, showing manual entry form',data:{hasAge:!!credential.age,hasJurisdiction:!!credential.jurisdiction,accredited:credential.accredited},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion agent log
      setError(
        `Credential data is incomplete. Please enter the missing credential data (age, jurisdiction, accredited) manually below.`
      );
      setShowManualEntry(true);
      return; // Don't proceed, wait for manual entry
    }

    // Check if we're using manual entry data
    if (showManualEntry && manualCredentialData.age) {
      credential = {
        credential_hash: credentialHash,
        age: manualCredentialData.age,
        jurisdiction: manualCredentialData.jurisdiction,
        accredited: manualCredentialData.accredited,
      };
    }

    // Ensure we have all required credential data
    if (!credential || !credential.age) {
      if (showManualEntry) {
        setError('Please fill in all credential data fields (age, jurisdiction, accredited).');
      } else {
        setError('Credential data is incomplete. The credential must have age, jurisdiction, and accredited status.');
      }
      return;
    }

    // Build credential object with all required fields
    // Convert jurisdiction to number if it's a string (could be a hash string or number)
    let jurisdictionValue = credential.jurisdiction;
    if (typeof jurisdictionValue === 'string') {
      // If it's a hex string, convert to number
      if (jurisdictionValue.startsWith('0x')) {
        jurisdictionValue = Number(BigInt(jurisdictionValue));
      } else if (/^[A-Z]{2,3}$/.test(jurisdictionValue.trim().toUpperCase())) {
        // If it's a jurisdiction code (e.g., "US", "UK"), convert to hash
        // Keep as string to preserve precision (backend will truncate to int64)
        try {
          const hashString = jurisdictionStringToHash(jurisdictionValue.trim().toUpperCase());
          // Keep as string - backend will handle truncation to int64
          jurisdictionValue = hashString;
        } catch (err) {
          setError(`Invalid jurisdiction: ${err.message}`);
          return;
        }
      } else {
        // Try to parse as number
        const parsed = parseInt(jurisdictionValue, 10);
        if (!isNaN(parsed)) {
          jurisdictionValue = parsed;
        } else {
          setError('Invalid jurisdiction format. Please enter a jurisdiction code (e.g., "US") or a hash number.');
          return;
        }
      }
    }

    // Ensure credentialHash is always set - use state variable as final fallback
    const hashToUse = credential?.credential_hash || credentialHash;
    if (!hashToUse) {
      setError('Credential hash is required');
      return;
    }

    const credentialData = {
      credentialHash: hashToUse,
      userAddress: account,
      age: Number(credential.age),
      jurisdiction: jurisdictionValue,
      accredited: credential.accredited ? 1 : 0,
    };

    generateProofMutation.mutate({
      credential: credentialData,
      requirements: {
        protocolAddress: protocolAddress,
        minAge: requirements.minAge,
        allowedJurisdictions: requirements.allowedJurisdictions,
        requireAccredited: requirements.requireAccredited,
      },
    });
  };

  const handleVerifyProof = async () => {
    if (!proofResult) {
      setError('Please generate a proof first');
      return;
    }

    // Use credentialHash from proofResult if available, otherwise use state
    const hashToUse = proofResult.credentialHash || credentialHash;

    if (!account || !protocolAddress || !hashToUse) {
      setError('Missing required information');
      return;
    }

    setError(null);
    setSuccess(null);

    verifyProofMutation.mutate({
      protocolAddress,
      userAddress: account,
      credentialHash: hashToUse,
      proof: proofResult.proof,
      publicSignals: proofResult.publicSignals || proofResult.publicInputs,
    });
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
        User Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Connected: {account}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* My Credentials Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Credentials
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Credentials registered for your address. Click on a credential hash to use it.
              </Typography>
              {loadingCredentials ? (
                <CircularProgress size={24} />
              ) : userCredentials && userCredentials.length > 0 ? (
                <List>
                  {userCredentials.map((credential, index) => (
                    <React.Fragment key={credential.credential_hash || index}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                        onClick={() => {
                          setCredentialHash(credential.credential_hash);
                          setSelectedCredential(credential);
                          setSuccess(`Credential selected: ${credential.credential_hash}`);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
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
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={credential.status || 'active'}
                                size="small"
                                color={credential.status === 'active' ? 'success' : 'default'}
                                sx={{ mr: 1 }}
                              />
                              {credential.issuer_address && (
                                <Typography variant="caption" color="text.secondary">
                                  Issuer: {credential.issuer_address.slice(0, 10)}...
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < userCredentials.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No credentials found for your address. Ask an issuer to register a credential for you.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Protocol Requirements Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Check Protocol Requirements
              </Typography>
              <TextField
                fullWidth
                label="Protocol Address"
                value={protocolAddress}
                onChange={(e) => setProtocolAddress(e.target.value)}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  if (protocolAddress && protocolAddress.length === 42) {
                    // Query will run automatically via React Query
                  }
                }}
                disabled={!protocolAddress || protocolAddress.length !== 42}
              >
                Check Requirements
              </Button>

              {loadingRequirements && <CircularProgress size={24} sx={{ mt: 2 }} />}
              {requirements && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Min Age:</strong> {requirements.minAge}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Require Accredited:</strong>{' '}
                    {requirements.requireAccredited ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Allowed Jurisdictions:</strong>{' '}
                    {requirements.allowedJurisdictions?.length || 0}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Access Status Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Access Status
              </Typography>
              {accessStatus ? (
                <Alert
                  severity={accessStatus.hasAccess ? 'success' : 'warning'}
                  sx={{ mt: 2 }}
                >
                  {accessStatus.hasAccess
                    ? 'You have access to this protocol'
                    : 'You do not have access to this protocol'}
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Enter a protocol address to check access status
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Proof Generation Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate ZK Proof
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select a credential from above, or enter your credential hash manually if you know it.
              </Alert>
              <TextField
                fullWidth
                label="Credential Hash"
                value={credentialHash}
                onChange={(e) => {
                  setCredentialHash(e.target.value);
                  setShowManualEntry(false); // Reset manual entry when hash changes
                }}
                placeholder="0x..."
                helperText="Enter your credential hash (32-byte hex string starting with 0x)"
                sx={{ mb: 2 }}
              />
              
              {/* Manual credential data entry (shown when credential exists on-chain but not in DB) */}
              {/* #region agent log */}
              {(() => {
                fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.jsx:460',message:'Rendering check for manual entry form',data:{showManualEntry,willRender:!!showManualEntry},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
                return null;
              })()}
              {/* #endregion agent log */}
              {showManualEntry && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 2, 
                    border: '3px solid red',
                    backgroundColor: '#fff3cd',
                    fontSize: '16px',
                    zIndex: 9999
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ color: 'red', fontWeight: 'bold' }}>
                    ⚠️ MANUAL CREDENTIAL DATA ENTRY REQUIRED
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Credential found on-chain but data is missing. Please enter the credential details:
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Age"
                        type="number"
                        value={manualCredentialData.age}
                        onChange={(e) => setManualCredentialData({
                          ...manualCredentialData,
                          age: e.target.value,
                        })}
                        inputProps={{ min: 0, max: 150 }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Jurisdiction (e.g., US, UK, CA)"
                        value={manualCredentialData.jurisdiction}
                        onChange={(e) => setManualCredentialData({
                          ...manualCredentialData,
                          jurisdiction: e.target.value,
                        })}
                        placeholder="US"
                        helperText="Enter jurisdiction code or hash"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Accredited"
                        type="number"
                        value={manualCredentialData.accredited}
                        onChange={(e) => setManualCredentialData({
                          ...manualCredentialData,
                          accredited: parseInt(e.target.value) || 0,
                        })}
                        inputProps={{ min: 0, max: 1 }}
                        helperText="1 = Yes, 0 = No"
                        required
                      />
                    </Grid>
                  </Grid>
                </Alert>
              )}
              {credentialHash && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(credentialHash);
                      setSuccess('Credential hash copied to clipboard!');
                    }}
                  >
                    Copy Hash
                  </Button>
                  <Button
                    size="small"
                    onClick={async () => {
                      try {
                        const isValid = await contractClient.isCredentialValid(credentialHash);
                        if (isValid) {
                          setSuccess('Credential is valid!');
                        } else {
                          setError('Credential is invalid or revoked');
                        }
                      } catch (err) {
                        setError(`Error checking credential: ${err.message}`);
                      }
                    }}
                    sx={{ ml: 1 }}
                  >
                    Verify Hash
                  </Button>
                </Box>
              )}
              <Button
                variant="contained"
                onClick={handleGenerateProof}
                disabled={
                  !credentialHash ||
                  !protocolAddress ||
                  !requirements ||
                  generateProofMutation.isPending
                }
                sx={{ mb: 2 }}
              >
                {generateProofMutation.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Generating...
                  </>
                ) : (
                  'Generate Proof'
                )}
              </Button>

              {proofResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Proof generated successfully!
                  </Alert>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleVerifyProof}
                    disabled={verifyProofMutation.isPending}
                    fullWidth
                  >
                    {verifyProofMutation.isPending ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Verifying...
                      </>
                    ) : (
                      'Verify Proof & Grant Access'
                    )}
                  </Button>
                </Box>
              )}
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

export default UserDashboard;

