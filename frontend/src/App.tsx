import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { ProcessFlow } from './components/ProcessFlow';
import { IdentityVerification } from './components/Demo/IdentityVerification';
import { SDKDocs } from './components/Docs/SDKDocs';
import { PitchDeck } from './components/PitchDeck';
import { VisualFlow } from './components/VisualFlow';
import { Github, Twitter, Menu } from 'lucide-react';

function App() {
  const [view, setView] = useState<'landing' | 'demo' | 'docs' | 'pitch'>('landing');

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
              <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Connect Wallet</button>
            </div>
          </div>
        </nav>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <IdentityVerification />
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
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Connect Wallet</button>
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
