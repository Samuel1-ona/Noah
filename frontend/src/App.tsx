import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { ProcessFlow } from './components/ProcessFlow';
import { IdentityVerification } from './components/Demo/IdentityVerification';
import { SDKDocs } from './components/Docs/SDKDocs';
import { PitchDeck } from './components/PitchDeck';
import { VisualFlow } from './components/VisualFlow';
import { Github, Twitter, Menu, AlertCircle } from 'lucide-react';

const NOAH_CHAIN_ID = '0x270f'; // 9999
const NOAH_NETWORK = {
  chainId: NOAH_CHAIN_ID,
  chainName: 'Noah Local',
  nativeCurrency: {
    name: 'Noah Token',
    symbol: 'TOK',
    decimals: 18
  },
  rpcUrls: ['http://127.0.0.1:9650/ext/bc/noah/rpc'],
  blockExplorerUrls: []
};

function App() {
  const [view, setView] = useState<'landing' | 'demo' | 'docs' | 'pitch'>('landing');
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NOAH_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NOAH_NETWORK],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
        setAccount(accounts[0]);

        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(currentChainId);

        if (currentChainId !== NOAH_CHAIN_ID) {
          await switchNetwork();
          const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(newChainId);
        }
      } catch (err) {
        console.error('Failed to connect wallet:', err);
      }
    } else {
      alert('Please install MetaMask to use Noah on Avalanche.');
    }
  };

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (newChainId: string) => {
        setChainId(newChainId);
      });
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
    }
  }, []);

  // Sync scroll on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (view === 'demo') {
    return (
      <div className="demo-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bg-glow" style={{ opacity: 0.4 }} />

        {/* Demo Navbar */}
        <nav style={{
          padding: '1.5rem 0',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(5, 5, 5, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
              onClick={() => setView('landing')}
            >
              <img src="/logo.png" alt="Noah" style={{ width: 32, height: 32, borderRadius: '0.5rem', objectFit: 'contain' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>NOAH</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <button
                onClick={() => setView('landing')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Back to Home
              </button>
              {account ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {chainId !== NOAH_CHAIN_ID && (
                    <button onClick={switchNetwork} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      <AlertCircle size={14} /> Switch to Noah Local
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: chainId === NOAH_CHAIN_ID ? '#22C55E' : '#EF4444' }} />
                    <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
                  </div>
                </div>
              ) : (
                <button onClick={connectWallet} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Connect Wallet</button>
              )}
            </div>
          </div>
        </nav>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <IdentityVerification
            account={account}
            onConnect={connectWallet}
            onSwitchNetwork={switchNetwork}
            isWrongNetwork={chainId !== NOAH_CHAIN_ID && !!account}
          />
        </main>

        <footer style={{ padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Powered by Noah Protocol • Zero-Knowledge Identity Layer</p>
        </footer>
      </div>
    );
  }

  if (view === 'docs') {
    return (
      <div className="docs-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bg-glow" style={{ opacity: 0.3 }} />

        {/* Docs Navbar */}
        <nav style={{
          padding: '1.25rem 0',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(5, 5, 5, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 100
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setView('landing')}>
              <img src="/logo.png" alt="Noah" style={{ width: 28, height: 28, borderRadius: '0.4rem', objectFit: 'contain' }} />
              <span style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em' }}>NOAH <span style={{ color: 'var(--primary)', fontSize: '0.6rem' }}>DOCS</span></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <a href="https://github.com/Samuel1-ona/Noah" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)' }}>
                <Github size={20} />
              </a>
              <button
                onClick={() => setView('demo')}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                Launch Demo
              </button>
            </div>
          </div>
        </nav>

        <SDKDocs />

        <footer style={{ padding: '2.5rem 0', borderTop: '1px solid var(--border)', background: 'var(--bg-black)' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>© 2026 Noah Protocol. Build with privacy.</p>
            <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Back to Home</button>
          </div>
        </footer>
      </div>
    );
  }

  if (view === 'pitch') {
    return <PitchDeck onClose={() => setView('landing')} />;
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '1.5rem 0',
        background: 'rgba(5, 5, 5, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="Noah" style={{ width: 32, height: 32, borderRadius: '0.5rem', objectFit: 'contain' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>NOAH <span style={{ color: 'var(--primary)', fontSize: '0.75rem', verticalAlign: 'top' }}>AVAX</span></span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="nav-links">
            <button
              onClick={() => setView('docs')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Technology
            </button>
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Ecosystem</a>
            <button
              onClick={() => setView('docs')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Developers
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="https://github.com/Samuel1-ona/Noah" target="_blank" rel="noopener noreferrer">
                <Github size={20} style={{ color: 'var(--text-dim)', cursor: 'pointer' }} />
              </a>
              <Twitter size={20} style={{ color: 'var(--text-dim)', cursor: 'pointer' }} />
            </div>
            {account ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {chainId !== NOAH_CHAIN_ID && (
                  <button onClick={switchNetwork} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    <AlertCircle size={12} /> Wrong Network
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: chainId === NOAH_CHAIN_ID ? '#22C55E' : '#EF4444' }} />
                  <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
              </div>
            ) : (
              <button onClick={connectWallet} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Connect Wallet</button>
            )}
          </div>

          <Menu className="mobile-menu" size={24} style={{ display: 'none' }} />
        </div>
      </nav>

      <main>
        <Hero onLaunchDemo={() => setView('demo')} onOpenPitch={() => setView('pitch')} />
        <VisualFlow />
        <ProcessFlow />

        {/* Mini Demo Section for Landing */}
        <section id="demo" className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Experience the Privacy</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginTop: '0.5rem', marginBottom: '3rem' }}>Ready to get started?</h2>
          <button className="btn btn-primary" onClick={() => setView('demo')} style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Start Verification Flow
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '4rem 0', marginTop: '4rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>© 2026 Noah Protocol. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.875rem' }}>Terms of Service</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
