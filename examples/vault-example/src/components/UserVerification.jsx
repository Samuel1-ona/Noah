import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useUser, generateCredentialHash } from 'noah-protocol-sdk';
import { toast } from 'react-toastify';
import { getCredentialHash } from '../config/contracts';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  VerifiedUser,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Lock,
  AutoAwesome,
} from '@mui/icons-material';
import { Avatar } from '@mui/material';

export default function UserVerification({ signer, account, vaultAddress, onAccessGranted }) {
  const [credentialHash, setCredentialHash] = useState('');
  const [credentialAge, setCredentialAge] = useState(18);
  const [credentialJurisdiction, setCredentialJurisdiction] = useState('US');
  const [credentialTimestamp, setCredentialTimestamp] = useState(Date.now());
  const [autoGenerateHash, setAutoGenerateHash] = useState(true);
  const [generatedProof, setGeneratedProof] = useState(null);
  const [isEligible, setIsEligible] = useState({ age: false, jurisdiction: false });
  // Get API URL from environment variable only
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  const {
    protocolRequirements,
    isLoadingRequirements,
    requirementsError,
    generateProof,
    verifyAndGrantAccess,
    checkCredentialValidity,
  } = useUser(signer, {
    userAddress: account || undefined,
    protocolAddress: vaultAddress || undefined,
    apiBaseUrl: apiBaseUrl,
  });

  const [credentialValid, setCredentialValid] = useState(null);
  const [checkingCredential, setCheckingCredential] = useState(false);
  const [loadingRegisteredCredential, setLoadingRegisteredCredential] = useState(false);
  const [lastLoadedCredentialHash, setLastLoadedCredentialHash] = useState(null);

  // Load registered credential hash from localStorage when account changes or when component becomes visible
  useEffect(() => {
    const loadRegisteredCredential = async () => {
      if (!account || !signer) {
        return;
      }

      setLoadingRegisteredCredential(true);
      
      // Small delay to ensure localStorage is updated after registration
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        // Check localStorage for registered credentials
        const registeredCredentials = JSON.parse(localStorage.getItem('registeredCredentials') || '{}');
        const userCredentials = registeredCredentials[account] || [];

        if (userCredentials.length > 0) {
          // Try to find a valid registered credential
          for (const hash of userCredentials) {
            try {
              const isValid = await checkCredentialValidity.mutateAsync(hash);
              if (isValid) {
                // Found a valid registered credential, use it
                // Only show toast if this is a new credential hash
                if (hash !== lastLoadedCredentialHash && hash !== credentialHash) {
                  toast.success('✓ Loaded registered credential hash');
                  setLastLoadedCredentialHash(hash);
                }
                setCredentialHash(hash);
                setCredentialValid(true);
                setAutoGenerateHash(false); // Disable auto-generation when using registered credential
                setLoadingRegisteredCredential(false);
                return;
              }
            } catch (error) {
              // Continue to next credential if this one is invalid
              console.log(`Credential ${hash} is not valid, trying next...`);
            }
          }
        }

        // Also check if there's a credential hash stored in the contract for this protocol
        if (vaultAddress) {
          try {
            const { ProtocolClient } = await import('noah-protocol-sdk');
            const protocolClient = new ProtocolClient(signer);
            // Note: getUserCredential might not be available in ProtocolClient, so we'll call the contract directly
            const PROTOCOL_ACCESS_CONTROL_ABI = [
              'function userCredentials(address protocol, address user) view returns (bytes32)'
            ];
            const { getContractAddress } = await import('../config/contracts');
            const protocolAccessControlAddress = await getContractAddress('ProtocolAccessControl');
            
            if (protocolAccessControlAddress) {
              const contract = new ethers.Contract(protocolAccessControlAddress, PROTOCOL_ACCESS_CONTROL_ABI, signer);
              const storedHash = await contract.userCredentials(vaultAddress, account);
              
              // Check if stored hash is not empty (0x0000...)
              if (storedHash && storedHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                const isValid = await checkCredentialValidity.mutateAsync(storedHash);
                if (isValid) {
                  // Only show toast if this is a new credential hash
                  if (storedHash !== lastLoadedCredentialHash && storedHash !== credentialHash) {
                    toast.success('✓ Loaded credential hash from protocol');
                    setLastLoadedCredentialHash(storedHash);
                  }
                  setCredentialHash(storedHash);
                  setCredentialValid(true);
                  setAutoGenerateHash(false);
                  setLoadingRegisteredCredential(false);
                  return;
                }
              }
            }
          } catch (error) {
            // Contract call failed, continue with auto-generation
            console.log('Could not load credential from contract:', error.message);
          }
        }

        // If no registered credential found, fall back to auto-generation
        if (autoGenerateHash) {
          try {
            const result = generateCredentialHash({
              userAddress: account,
              age: credentialAge,
              jurisdiction: credentialJurisdiction,
              accredited: false,
              timestamp: credentialTimestamp,
            });
            setCredentialHash(result.credentialHash);
            setCredentialValid(null);
          } catch (error) {
            console.error('Error generating credential hash:', error);
          }
        }
      } catch (error) {
        console.error('Error loading registered credential:', error);
      } finally {
        setLoadingRegisteredCredential(false);
      }
    };

    loadRegisteredCredential();
    
    // Listen for storage events to reload when credential is registered in another tab/window
    const handleStorageChange = (e) => {
      if (e.key === 'registeredCredentials' && account) {
        console.log('Registered credentials updated, reloading...');
        // Only reload if we don't already have a valid credential hash loaded
        if (!credentialHash || credentialValid === false) {
          loadRegisteredCredential();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also trigger a custom event when localStorage is updated in the same tab
    const handleCustomStorageUpdate = () => {
      if (account) {
        console.log('Registered credentials updated (same tab), reloading...');
        // Only reload if we don't already have a valid credential hash loaded
        if (!credentialHash || credentialValid === false) {
          loadRegisteredCredential();
        }
      }
    };
    
    window.addEventListener('credentialRegistered', handleCustomStorageUpdate);
    
    // Periodic check (every 10 seconds) to catch updates - less frequent to avoid spam
    const interval = setInterval(() => {
      if (account && signer && !loadingRegisteredCredential) {
        // Only check if we don't have a valid credential already
        if (!credentialHash || credentialValid === false) {
          loadRegisteredCredential();
        }
      }
    }, 10000); // Increased from 3 seconds to 10 seconds to reduce spam
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('credentialRegistered', handleCustomStorageUpdate);
      clearInterval(interval);
    };
  }, [account, signer, vaultAddress]);

  // Auto-generate credential hash when inputs change (only if auto-generate is enabled and no registered credential is loaded)
  useEffect(() => {
    if (!autoGenerateHash || !account || !credentialAge || !credentialJurisdiction || loadingRegisteredCredential) {
      return;
    }

    // Don't auto-generate if we already have a credential hash set
    if (credentialHash && credentialValid !== null) {
      return;
    }

    try {
      const result = generateCredentialHash({
        userAddress: account,
        age: credentialAge,
        jurisdiction: credentialJurisdiction,
        accredited: false,
        timestamp: credentialTimestamp,
      });
      
      setCredentialHash(result.credentialHash);
      setCredentialValid(null);
    } catch (error) {
      console.error('Error generating credential hash:', error);
    }
  }, [account, credentialAge, credentialJurisdiction, credentialTimestamp, autoGenerateHash, loadingRegisteredCredential]);

  // Check credential validity when hash changes
  useEffect(() => {
    const checkCredential = async () => {
      if (!credentialHash || !signer) {
        setCredentialValid(null);
        return;
      }

      if (!credentialHash.startsWith('0x') || credentialHash.length !== 66) {
        setCredentialValid(false);
        return;
      }

      setCheckingCredential(true);
      try {
        const isValid = await checkCredentialValidity.mutateAsync(credentialHash);
        setCredentialValid(isValid);
        if (!isValid) {
          toast.warning('⚠️ This credential is not registered or has been revoked.');
        }
      } catch (error) {
        console.error('Error checking credential:', error);
        setCredentialValid(false);
      } finally {
        setCheckingCredential(false);
      }
    };

    const timeoutId = setTimeout(checkCredential, 500);
    return () => clearTimeout(timeoutId);
  }, [credentialHash, signer]);

  // Check if user meets requirements
  useEffect(() => {
    const jurisdictionCheck = credentialJurisdiction.length > 0 && 
                              credentialJurisdiction.trim() !== '';

    if (!protocolRequirements) {
      const ageCheck = credentialAge >= 18;
      setIsEligible({ age: ageCheck, jurisdiction: jurisdictionCheck });
      return;
    }

    const ageCheck = credentialAge >= (protocolRequirements.minAge || 18);

    setIsEligible({
      age: ageCheck,
      jurisdiction: jurisdictionCheck,
    });

    if (generatedProof && protocolRequirements) {
      const proofMinAge = Number(generatedProof.publicSignals?.[0]);
      const proofAccredited = Number(generatedProof.publicSignals?.[11]);
      const expectedMinAge = protocolRequirements.minAge;
      const expectedAccredited = protocolRequirements.requireAccredited ? 1 : 0;

      if (proofMinAge !== expectedMinAge || proofAccredited !== expectedAccredited) {
        setGeneratedProof(null);
        toast.info('Vault requirements changed. Please regenerate your proof.');
      }
    }
  }, [credentialAge, credentialJurisdiction, protocolRequirements]);

  const handleGenerateProof = async () => {
    if (!vaultAddress) {
      toast.error('Vault address is required.');
      return;
    }

    if (!credentialHash) {
      toast.error('Please enter your credential hash.');
      return;
    }

    if (credentialValid === false) {
      toast.error('Credential is not registered. Please register it first.');
      return;
    }

    if (!isEligible.age || !isEligible.jurisdiction) {
      toast.error('Please ensure you meet all requirements.');
      return;
    }

    if (!protocolRequirements) {
      toast.error('Could not fetch requirements.');
      return;
    }

    if (credentialAge < protocolRequirements.minAge) {
      toast.error(`Your age (${credentialAge}) is below the minimum requirement (${protocolRequirements.minAge}).`);
      return;
    }

    try {
      const proofAccredited = protocolRequirements.requireAccredited ? 1 : 0;

      const proofRequest = {
        credential: {
          credentialHash,
          age: credentialAge,
          jurisdiction: credentialJurisdiction,
          accredited: proofAccredited,
        },
        requirements: {
          ...protocolRequirements,
          protocolAddress: vaultAddress,
        },
      };

      const proof = await generateProof.mutateAsync(proofRequest);

      if (proof.publicSignals && proof.publicSignals.length >= 12) {
        const proofMinAge = Number(proof.publicSignals[0]);
        const proofAccredited = Number(proof.publicSignals[11]);
        const expectedMinAge = protocolRequirements.minAge;
        const expectedAccredited = protocolRequirements.requireAccredited ? 1 : 0;
        
        if (proofMinAge !== expectedMinAge || proofAccredited !== expectedAccredited) {
          toast.error('Proof values do not match vault requirements. Please regenerate.');
          setGeneratedProof(null);
          return;
        }
      }

      setGeneratedProof({
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        credentialHash: proof.credentialHash,
        protocolAddress: vaultAddress,
      });

      toast.success('Proof generated successfully!');
    } catch (error) {
      console.error('Proof generation error:', error);
      toast.error(`Failed to generate proof: ${error.message}`);
    }
  };

  const handleVerifyAndGrantAccess = async () => {
    if (!generatedProof || !vaultAddress) {
      toast.warning('Please generate a proof first');
      return;
    }

    try {
      const vaultAbi = [
        'function verifyAndGrantUserAccess(uint[2] a, uint[2][2] b, uint[2] c, uint[13] publicSignals, bytes32 credentialHash, address user)'
      ];
      
      const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, signer);
      
      const a = [BigInt(generatedProof.proof.a[0]), BigInt(generatedProof.proof.a[1])];
      const b = [
        [BigInt(generatedProof.proof.b[0][0]), BigInt(generatedProof.proof.b[0][1])],
        [BigInt(generatedProof.proof.b[1][0]), BigInt(generatedProof.proof.b[1][1])]
      ];
      const c = [BigInt(generatedProof.proof.c[0]), BigInt(generatedProof.proof.c[1])];
      const publicSignalsArray = generatedProof.publicSignals.slice(0, 13).map(s => BigInt(s));
      
      const tx = await vaultContract.verifyAndGrantUserAccess(
        a, b, c, publicSignalsArray, generatedProof.credentialHash, account
      );
      
      toast.info(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      toast.success(`Access granted! Transaction: ${tx.hash.substring(0, 10)}...`);
      
      setGeneratedProof(null);
      if (onAccessGranted) {
        setTimeout(() => onAccessGranted(), 2000);
      }
    } catch (error) {
      console.error('Failed to verify and grant access:', error);
      toast.error(`Failed to verify and grant access: ${error.message}`);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          src="/noah-logo.png"
          alt="Noah Logo"
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
          }}
          variant="rounded"
        />
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Verify Your Eligibility
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Powered by Noah Protocol
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Verify that you meet the vault requirements to gain access. Your credential is automatically verified in the background.
      </Typography>

      {protocolRequirements && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Vault Requirements
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              label={`Min Age: ${protocolRequirements.minAge}`}
              color={isEligible.age ? 'success' : 'error'}
              icon={isEligible.age ? <CheckCircle /> : <Cancel />}
              size="small"
            />
            <Chip
              label={`Jurisdictions: ${protocolRequirements.allowedJurisdictions.length}`}
              color={isEligible.jurisdiction ? 'success' : 'error'}
              icon={isEligible.jurisdiction ? <CheckCircle /> : <Cancel />}
              size="small"
            />
            <Chip
              label={`Accredited: ${protocolRequirements.requireAccredited ? 'Required' : 'Not Required'}`}
              color={protocolRequirements.requireAccredited ? 'warning' : 'default'}
              size="small"
            />
          </Stack>
        </Alert>
      )}

      {isLoadingRequirements && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading vault requirements...
          </Typography>
        </Box>
      )}

      <Stack spacing={3}>
        <Box>
          {loadingRegisteredCredential && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Loading registered credential from admin operations...</Typography>
              </Box>
            </Alert>
          )}
          <TextField
            fullWidth
            label="Credential Hash"
            value={credentialHash}
            onChange={(e) => {
              setCredentialHash(e.target.value);
              setAutoGenerateHash(false);
            }}
            placeholder="0x..."
            disabled={Boolean(checkingCredential || loadingRegisteredCredential || (autoGenerateHash && account))}
            error={credentialValid === false}
            helperText={
              loadingRegisteredCredential ? 'Loading registered credential...' :
              checkingCredential ? 'Checking credential...' :
              credentialValid === true ? '✓ Credential is registered and valid (loaded automatically)' :
              credentialValid === false ? '✗ Credential not registered or revoked' :
              autoGenerateHash && account ? 'Hash auto-generated. Waiting for registration...' :
              'Enter your registered credential hash or enable auto-generation'
            }
            InputProps={{
              endAdornment: account && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoGenerateHash}
                      onChange={(e) => {
                        setAutoGenerateHash(e.target.checked);
                        if (e.target.checked) {
                          setCredentialTimestamp(Date.now());
                        }
                      }}
                      size="small"
                      disabled={loadingRegisteredCredential}
                    />
                  }
                  label="Auto-generate"
                  sx={{ mr: 1 }}
                />
              ),
            }}
          />
          {autoGenerateHash && account && credentialHash && credentialValid === false && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              This credential hash needs to be registered by an issuer. Go to the <strong>Admin Operations</strong> tab to register it.
            </Alert>
          )}
        </Box>

        <TextField
          fullWidth
          label="Your Age"
          type="number"
          value={credentialAge}
          onChange={(e) => setCredentialAge(parseInt(e.target.value) || 18)}
          inputProps={{ min: 18, max: 100 }}
          error={!isEligible.age && !!protocolRequirements}
          helperText={
            protocolRequirements && (
              isEligible.age 
                ? `✓ You meet the age requirement (${protocolRequirements.minAge}+)` 
                : `✗ You must be at least ${protocolRequirements.minAge} years old`
            )
          }
        />

        {protocolRequirements && protocolRequirements.requireAccredited && (
          <Alert severity="warning">
            <strong>Note:</strong> This vault requires accredited investor status. The proof will be generated with accredited = 1.
          </Alert>
        )}

        <FormControl fullWidth>
          <InputLabel>Your Jurisdiction</InputLabel>
          <Select
            value={credentialJurisdiction}
            onChange={(e) => setCredentialJurisdiction(e.target.value)}
            label="Your Jurisdiction"
            error={!isEligible.jurisdiction && !!protocolRequirements}
          >
            <MenuItem value="US">United States (US)</MenuItem>
            <MenuItem value="UK">United Kingdom (UK)</MenuItem>
            <MenuItem value="CA">Canada (CA)</MenuItem>
            <MenuItem value="DE">Germany (DE)</MenuItem>
            <MenuItem value="FR">France (FR)</MenuItem>
            <MenuItem value="AU">Australia (AU)</MenuItem>
            <MenuItem value="JP">Japan (JP)</MenuItem>
            <MenuItem value="SG">Singapore (SG)</MenuItem>
          </Select>
          {protocolRequirements && (
            <Typography variant="caption" color={isEligible.jurisdiction ? 'success.main' : 'error.main'} sx={{ mt: 0.5 }}>
              {isEligible.jurisdiction ? '✓ Jurisdiction selected' : '✗ Please select a valid jurisdiction'}
            </Typography>
          )}
        </FormControl>

        <Divider />

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={generateProof.isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
            onClick={handleGenerateProof}
            disabled={
              generateProof.isLoading ||
              !vaultAddress ||
              !credentialHash ||
              !isEligible.age ||
              !isEligible.jurisdiction ||
              credentialValid === false ||
              checkingCredential
            }
            fullWidth
          >
            {generateProof.isLoading ? 'Generating Proof...' : 'Verify & Generate Proof'}
          </Button>

          {generatedProof && (
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<VerifiedUser />}
              onClick={handleVerifyAndGrantAccess}
              fullWidth
            >
              Verify Proof & Grant Access
            </Button>
          )}
        </Stack>

        {requirementsError && !requirementsError.message?.includes('BAD_DATA') && (
          <Alert severity="error">
            Error loading requirements: {requirementsError.message}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
