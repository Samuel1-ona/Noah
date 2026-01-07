import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Container, Box, Typography, Button, Paper, Tabs, Tab, Chip, Avatar } from '@mui/material';
import { AccountBalanceWallet, VpnKey } from '@mui/icons-material';
import VaultComponent from './components/VaultComponent';
import UserVerification from './components/UserVerification';
import AdminSection from './components/AdminSection';
import { getVaultAddress } from './config/contracts';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = user, 1 = admin

  // Load vault address from contracts.json on mount
  useEffect(() => {
    const loadVaultAddress = async () => {
      try {
        const address = await getVaultAddress();
        if (address) {
          setVaultAddress(address);
          setVaultLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load vault address:', error);
      }
    };
    loadVaultAddress();
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setConnected(true);

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error(`Failed to connect wallet: ${error.message}`);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };
    checkConnection();
  }, []);

  const checkAccess = async () => {
    if (!vaultAddress || !signer) {
      toast.warning('Please enter vault address and connect wallet');
      return;
    }

    try {
      const { ProtocolClient } = await import('noah-protocol-sdk');
      const protocolClient = new ProtocolClient(signer);
      const access = await protocolClient.checkUserAccess(vaultAddress, account);
      setHasAccess(access);
      
      if (access) {
        toast.success('You have access to the vault!');
      } else {
        toast.info('You do not have access. Please verify your credentials first.');
      }
    } catch (error) {
      console.error('Failed to check access:', error);
      toast.error(`Failed to check access: ${error.message}`);
    }
  };

  useEffect(() => {
    if (vaultAddress && account && signer) {
      checkAccess();
    }
  }, [vaultAddress, account]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={8}
            sx={{
              p: 4,
              mb: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src="/noah-logo.png"
                  alt="Noah Logo"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                  variant="rounded"
                />
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                    NOAH Vault
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Demonstrating Noah SDK integration with a DeFi vault
                  </Typography>
                </Box>
              </Box>
            </Box>

            {!connected ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Avatar
                    src="/noah-logo.png"
                    alt="Noah Logo"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: 2,
                      boxShadow: 4,
                    }}
                    variant="rounded"
                  />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Connect Your Wallet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Connect your MetaMask wallet to get started with the vault
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AccountBalanceWallet />}
                  onClick={connectWallet}
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                  Connect Wallet
                </Button>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Connected Wallet
                    </Typography>
                    <Chip
                      icon={<VpnKey />}
                      label={`${account?.substring(0, 6)}...${account?.substring(account.length - 4)}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  {hasAccess && (
                    <Chip
                      label="✓ Access Granted"
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={activeTab} onChange={handleTabChange} aria-label="navigation tabs">
                    <Tab label="User Operations" icon={<VpnKey />} iconPosition="start" />
                    <Tab label="Admin Operations" icon={<AccountBalanceWallet />} iconPosition="start" />
                  </Tabs>
                </Box>

                <Box sx={{ mt: 3 }}>
                  {activeTab === 0 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
                      <UserVerification
                        signer={signer}
                        account={account}
                        vaultAddress={vaultAddress}
                        onAccessGranted={checkAccess}
                      />
                      <VaultComponent
                        signer={signer}
                        account={account}
                        vaultAddress={vaultAddress}
                        hasAccess={hasAccess}
                        onAccessChange={checkAccess}
                      />
                    </Box>
                  )}
                  {activeTab === 1 && (
                    <AdminSection
                      signer={signer}
                      account={account}
                      vaultAddress={vaultAddress}
                      onRequirementsSet={checkAccess}
                    />
                  )}
                </Box>
              </>
            )}
          </Paper>
          
          {/* Footer with Noah Logo */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
              <Avatar
                src="/noah-logo.png"
                alt="Noah Logo"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  boxShadow: 2,
                }}
                variant="rounded"
              />
              <Typography variant="body2" color="rgba(255, 255, 255, 0.9)" sx={{ fontWeight: 500 }}>
                Powered by <strong>Noah Protocol</strong>
              </Typography>
            </Box>
            <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
              Privacy-Preserving KYC for DeFi
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
