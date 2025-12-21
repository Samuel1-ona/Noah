import React from 'react';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, CardActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to ZK-KYC Protocol
      </Typography>
      <Typography variant="body1" paragraph>
        A privacy-preserving KYC verification system using Zero-Knowledge proofs.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                For Users
              </Typography>
              <Typography variant="body2" paragraph>
                Generate ZK proofs to verify your credentials without revealing sensitive information.
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} to="/user" variant="contained" fullWidth>
                Go to User Dashboard
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                For Issuers
              </Typography>
              <Typography variant="body2" paragraph>
                Register and manage user credentials on the blockchain.
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} to="/issuer" variant="contained" fullWidth>
                Go to Issuer Dashboard
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                For Protocols
              </Typography>
              <Typography variant="body2" paragraph>
                Set requirements and verify user access using ZK proofs.
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} to="/protocol" variant="contained" fullWidth>
                Go to Protocol Dashboard
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default HomePage;

