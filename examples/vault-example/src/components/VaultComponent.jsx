import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  ArrowDownward,
  ArrowUpward,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { Avatar } from '@mui/material';

const VAULT_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function getBalance(address user) view returns (uint256)',
  'function getTotalDeposits() view returns (uint256)',
  'function hasAccess(address user) view returns (bool)',
  'function getRequirements() view returns (uint256 minAge, uint256[] allowedJurisdictions, bool requireAccredited)',
  'event Deposit(address indexed user, uint256 amount, uint256 timestamp)',
  'event Withdraw(address indexed user, uint256 amount, uint256 timestamp)',
];

export default function VaultComponent({ signer, account, vaultAddress, hasAccess, onAccessChange }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [userBalance, setUserBalance] = useState('0');
  const [totalDeposits, setTotalDeposits] = useState('0');
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const loadVaultData = async () => {
    if (!vaultAddress || !signer || !account) return;

    setLoadingBalance(true);
    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      
      try {
        const balance = await contract.getBalance(account);
        setUserBalance(ethers.formatEther(balance || 0n));
      } catch (error) {
        console.log('Balance not available yet:', error.message);
        setUserBalance('0');
      }

      try {
        const total = await contract.getTotalDeposits();
        setTotalDeposits(ethers.formatEther(total || 0n));
      } catch (error) {
        console.log('Total deposits not available:', error.message);
        setTotalDeposits('0');
      }

      try {
        const req = await contract.getRequirements();
        if (req && req.minAge !== undefined) {
          setRequirements({
            minAge: Number(req.minAge),
            allowedJurisdictions: req.allowedJurisdictions?.map(j => j.toString()) || [],
            requireAccredited: req.requireAccredited || false,
          });
        } else {
          setRequirements(null);
        }
      } catch (error) {
        console.log('Requirements not set yet.');
        setRequirements(null);
      }
    } catch (error) {
      if (!error.message?.includes('BAD_DATA') && !error.message?.includes('0x')) {
        console.error('Failed to load vault data:', error);
        toast.error(`Failed to load vault data: ${error.message}`);
      }
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    loadVaultData();
    const interval = setInterval(loadVaultData, 10000);
    return () => clearInterval(interval);
  }, [vaultAddress, account, hasAccess]);

  const handleDeposit = async () => {
    if (!vaultAddress || !signer || !hasAccess) {
      toast.error('You must verify your credentials first to deposit');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.warning('Please enter a valid deposit amount');
      return;
    }

    setLoading(true);
    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      const amount = ethers.parseEther(depositAmount);
      
      const tx = await contract.deposit({ value: amount });
      toast.info(`Transaction submitted: ${tx.hash}`);
      
      await tx.wait();
      toast.success('Deposit successful!');
      
      setDepositAmount('');
      await loadVaultData();
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error(`Deposit failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!vaultAddress || !signer || !hasAccess) {
      toast.error('You must verify your credentials first to withdraw');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.warning('Please enter a valid withdrawal amount');
      return;
    }

    const balance = parseFloat(userBalance);
    if (parseFloat(withdrawAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
      const amount = ethers.parseEther(withdrawAmount);
      
      const tx = await contract.withdraw(amount);
      toast.info(`Transaction submitted: ${tx.hash}`);
      
      await tx.wait();
      toast.success('Withdrawal successful!');
      
      setWithdrawAmount('');
      await loadVaultData();
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error(`Withdrawal failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!vaultAddress) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AccountBalance color="primary" />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Vault Operations
          </Typography>
        </Box>
        <Alert severity="info">Please enter a vault address to interact with the vault.</Alert>
      </Paper>
    );
  }

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
            Vault Operations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Secure DeFi Vault
          </Typography>
        </Box>
      </Box>

      {!hasAccess ? (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            You need to verify your credentials first before you can deposit or withdraw.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Use the "Verify Your Eligibility" section to get access.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          You have access to the vault!
        </Alert>
      )}

      {requirements ? (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Vault Requirements
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              <Chip label={`Min Age: ${requirements.minAge}`} size="small" />
              <Chip label={`Jurisdictions: ${requirements.allowedJurisdictions.length}`} size="small" />
              <Chip 
                label={`Accredited: ${requirements.requireAccredited ? 'Required' : 'Not Required'}`} 
                size="small"
                color={requirements.requireAccredited ? 'warning' : 'default'}
              />
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            The vault owner needs to set KYC requirements before users can verify credentials.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Your Balance
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {loadingBalance ? (
                  <CircularProgress size={24} />
                ) : (
                  `${parseFloat(userBalance).toFixed(4)} ETH`
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalance color="secondary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Total Deposits
                </Typography>
              </Box>
              <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                {loadingBalance ? (
                  <CircularProgress size={24} />
                ) : (
                  `${parseFloat(totalDeposits).toFixed(4)} ETH`
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ArrowDownward color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Deposit
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                inputProps={{ step: '0.001', min: '0' }}
                disabled={!hasAccess || loading}
                InputProps={{
                  endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowDownward />}
                onClick={handleDeposit}
                disabled={!hasAccess || loading || !depositAmount}
              >
                {loading ? 'Processing...' : 'Deposit'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ArrowUpward color="error" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Withdraw
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.0"
                inputProps={{ step: '0.001', min: '0', max: userBalance }}
                disabled={!hasAccess || loading}
                InputProps={{
                  endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowUpward />}
                onClick={handleWithdraw}
                disabled={!hasAccess || loading || !withdrawAmount}
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
}
