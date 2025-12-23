import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  Public as PublicIcon,
  AccountBalance as AccountBalanceIcon,
  Lock as LockIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: 2,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom align="center" fontWeight="bold">
            NOAH
          </Typography>
          <Typography variant="h5" align="center" sx={{ mb: 4, opacity: 0.9 }}>
            Privacy-Preserving KYC for DeFi
          </Typography>
          <Typography variant="h6" align="center" sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
            Enable DeFi protocols to verify user eligibility for compliance (KYC/AML) without
            exposing personal data. Users prove they meet requirements while keeping their actual
            data private.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/user"
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              to="/protocol"
              variant="outlined"
              size="large"
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white' } }}
            >
              For Protocols
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Primary Use Case Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Primary Use Case
          </Typography>
          <Typography variant="h6" align="center" sx={{ maxWidth: '900px', mx: 'auto', mt: 2 }}>
            NOAH enables DeFi protocols to verify user eligibility for compliance (KYC/AML) without
            exposing personal data. Users prove they meet requirements (age, jurisdiction,
            accreditation) while keeping their actual data private.
          </Typography>
        </Paper>
      </Container>

      {/* Specific Use Cases */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          Specific Use Cases
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5" component="h3">
                    DeFi Protocol Compliance
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <strong>Problem:</strong> Protocols need to verify user eligibility (age,
                  location, accreditation) but want to protect user privacy.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Solution:</strong> Users generate ZK proofs showing they meet requirements
                  without revealing exact values.
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  <strong>Example:</strong> A lending protocol requires users to be 18+ and from
                  allowed jurisdictions. Users prove eligibility without sharing their exact age or
                  location.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VerifiedUserIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5" component="h3">
                    Age-Restricted Services
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <strong>Use Case:</strong> Services requiring minimum age (e.g., 18+, 21+).
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  <strong>Example:</strong> A DeFi protocol restricts access to users 21+ in certain
                  jurisdictions. Users prove they meet both without revealing exact age or
                  location.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PublicIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5" component="h3">
                    Jurisdiction-Based Access Control
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <strong>Use Case:</strong> Protocols that must restrict access by jurisdiction
                  (e.g., US-only, EU-compliant).
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  <strong>Example:</strong> A protocol allows only users from specific countries.
                  Users prove membership in the allowed set without revealing their exact
                  jurisdiction.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5" component="h3">
                    Accredited Investor Verification
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <strong>Use Case:</strong> Protocols requiring accredited investor status for
                  certain products.
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  <strong>Example:</strong> An investment platform requires accredited status. Users
                  prove they are accredited without revealing other personal details.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SpeedIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5" component="h3">
                    Multi-Protocol Credential Reuse
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <strong>Use Case:</strong> Users can reuse the same credential across multiple
                  protocols.
                </Typography>
                <Typography variant="body2">
                  <strong>Benefit:</strong> One KYC credential can be used across multiple DeFi
                  protocols, each with different requirements.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LockIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5" component="h3">
                    Privacy-Preserving Compliance
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <strong>Use Case:</strong> Organizations that need to demonstrate compliance
                  without exposing user data.
                </Typography>
                <Typography variant="body2">
                  <strong>Benefit:</strong> Maintains regulatory compliance while protecting user
                  privacy.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Target Users */}
      <Box sx={{ bgcolor: 'grey.50', py: 6, mb: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
            Target Users
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom>
                    End Users
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    DeFi Participants
                  </Typography>
                  <Box sx={{ textAlign: 'left', mt: 2 }}>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Want to access DeFi protocols while maintaining privacy
                    </Typography>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Need to prove eligibility without exposing personal information
                    </Typography>
                    <Typography variant="body2" component="li">
                      Want to reuse credentials across multiple protocols
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom>
                    DeFi Protocols
                  </Typography>
                  <Box sx={{ textAlign: 'left', mt: 2 }}>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Need to verify user eligibility for compliance
                    </Typography>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Want to protect user privacy
                    </Typography>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Need flexible, customizable requirements
                    </Typography>
                    <Typography variant="body2" component="li">
                      Want on-chain verification for transparency
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <GavelIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom>
                    KYC Issuers
                  </Typography>
                  <Box sx={{ textAlign: 'left', mt: 2 }}>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Organizations that issue and verify credentials
                    </Typography>
                    <Typography variant="body2" component="li" sx={{ mb: 1 }}>
                      Need to manage credential lifecycle (issue, revoke)
                    </Typography>
                    <Typography variant="body2" component="li">
                      Want to maintain trust and compliance
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Real-World Scenarios */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          Real-World Scenarios
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Chip label="Scenario 1" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  Decentralized Exchange (DEX)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Requirement:</strong> Users must be 18+ and from allowed jurisdictions.
                </Typography>
                <Typography variant="body2">
                  <strong>Flow:</strong> User generates a ZK proof showing they meet requirements →
                  DEX verifies on-chain → Access granted.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Chip label="Scenario 2" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  Lending Protocol
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Requirement:</strong> Users must be accredited investors for certain
                  products.
      </Typography>
                <Typography variant="body2">
                  <strong>Flow:</strong> User proves accredited status → Protocol verifies → Access
                  to premium products.
      </Typography>
              </CardContent>
            </Card>
          </Grid>

        <Grid item xs={12} md={4}>
            <Card elevation={3}>
            <CardContent>
                <Chip label="Scenario 3" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" component="h3" gutterBottom>
                  Cross-Border DeFi Access
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Requirement:</strong> Protocol allows users from specific countries.
                </Typography>
                <Typography variant="body2">
                  <strong>Flow:</strong> User proves jurisdiction membership → Protocol verifies →
                  Access granted without revealing exact location.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Benefits */}
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 6, mb: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
            Benefits
          </Typography>
          <Grid container spacing={3}>
            {[
              { icon: LockIcon, title: 'Privacy', desc: 'Personal data never leaves the user\'s device' },
              { icon: CheckCircleIcon, title: 'Compliance', desc: 'Protocols can verify eligibility on-chain' },
              { icon: SpeedIcon, title: 'Flexibility', desc: 'Each protocol sets its own requirements' },
              { icon: SpeedIcon, title: 'Efficiency', desc: 'On-chain verification is fast and gas-efficient' },
              { icon: SecurityIcon, title: 'Security', desc: 'Credentials are revocable and tamper-proof' },
              { icon: VerifiedUserIcon, title: 'Reusability', desc: 'One credential works across multiple protocols' },
            ].map((benefit, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <benefit.icon sx={{ fontSize: 40, mt: 0.5 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2">{benefit.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Value Proposition */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Paper
          elevation={4}
          sx={{
            p: 6,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
            Value Proposition
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: '900px', mx: 'auto', mt: 3, mb: 2 }}>
            NOAH bridges privacy and compliance in DeFi: users maintain privacy while protocols meet
            regulatory requirements. It enables <strong>selective disclosure</strong>—users prove
            what's needed, nothing more.
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', opacity: 0.9 }}>
            This is especially valuable in DeFi, where privacy and compliance are both important.
          </Typography>
        </Paper>
      </Container>

      {/* Call to Action */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          Get Started
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                For Users
              </Typography>
              <Typography variant="body2" paragraph>
                  Generate ZK proofs to verify your credentials without revealing sensitive
                  information.
              </Typography>
              <Button component={Link} to="/user" variant="contained" fullWidth>
                Go to User Dashboard
              </Button>
              </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center' }}>
                <GavelIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                For Issuers
              </Typography>
              <Typography variant="body2" paragraph>
                Register and manage user credentials on the blockchain.
              </Typography>
              <Button component={Link} to="/issuer" variant="contained" fullWidth>
                Go to Issuer Dashboard
              </Button>
              </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                For Protocols
              </Typography>
              <Typography variant="body2" paragraph>
                Set requirements and verify user access using ZK proofs.
              </Typography>
              <Button component={Link} to="/protocol" variant="contained" fullWidth>
                Go to Protocol Dashboard
              </Button>
              </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.900',
          color: 'grey.300',
          py: 4,
          mt: 8,
          width: '100%',
        }}
      >
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                NOAH
              </Typography>
              <Typography variant="body2" paragraph>
                Privacy-Preserving KYC for DeFi
              </Typography>
              <Typography variant="body2" color="grey.400">
                Network for On-chain Authenticated Handshakes
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="body2" color="grey.400">
                  © {new Date().getFullYear()} NOAH. All rights reserved.
                </Typography>
                <Typography variant="body2" color="grey.500" sx={{ mt: 1 }}>
                  Built with Zero-Knowledge Proofs for Privacy-Preserving Compliance
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default HomePage;

