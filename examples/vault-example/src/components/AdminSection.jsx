import { Box, Typography, Paper, Stack, Avatar } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import ProtocolOperations from './ProtocolOperations';
import IssuerOperations from './IssuerOperations';

export default function AdminSection({ signer, account, vaultAddress, onRequirementsSet }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
            Admin Operations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Protocol & Issuer Management
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage protocol requirements and credential operations. These operations require admin/issuer permissions.
      </Typography>
      
      <Stack spacing={3}>
        <ProtocolOperations
          signer={signer}
          account={account}
          vaultAddress={vaultAddress}
          onRequirementsSet={onRequirementsSet}
        />
        
        <IssuerOperations
          signer={signer}
          account={account}
        />
      </Stack>
    </Box>
  );
}
