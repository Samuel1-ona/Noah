import React from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';

function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/user', label: 'User' },
    { path: '/issuer', label: 'Issuer' },
    { path: '/protocol', label: 'Protocol' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <img 
              src="/noah-logo.png" 
              alt="NOAH Logo" 
              style={{ height: '40px', width: 'auto' }}
              onError={(e) => {
                // Fallback if logo not found
                e.currentTarget.style.display = 'none';
              }}
            />
            <Typography variant="h6" component="div">
              NOAH
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                variant={location.pathname === item.path ? 'outlined' : 'text'}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <WalletButton />
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}

export default Layout;

