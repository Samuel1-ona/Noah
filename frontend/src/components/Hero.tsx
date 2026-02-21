import { motion } from 'framer-motion';
import { ArrowRight, Github, Zap } from 'lucide-react';

export const Hero: React.FC<{ onLaunchDemo: () => void }> = ({ onLaunchDemo }) => {
    return (
        <section className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
            <div className="bg-glow" />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        background: 'var(--primary-subtle)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '2rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Zap size={16} /> Now Live on Avalanche
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="gradient-text"
                    style={{
                        fontSize: 'clamp(3rem, 10vw, 5rem)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        maxWidth: '900px',
                        marginBottom: '1.5rem'
                    }}
                >
                    Private Identity for the Avalanche Ecosystem
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-muted)',
                        maxWidth: '650px',
                        marginBottom: '3rem',
                        lineHeight: 1.6
                    }}
                >
                    Securely verify your identity using Zero-Knowledge Proofs.
                    Verified once, reusable across every DeFi protocol on Avalanche.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{ display: 'flex', gap: '1rem' }}
                >
                    <button
                        onClick={onLaunchDemo}
                        className="btn btn-primary"
                        style={{ gap: '0.75rem', textDecoration: 'none', border: 'none' }}
                    >
                        Launch Demo <ArrowRight size={20} />
                    </button>
                    <a href="https://github.com/Samuel1-ona/Noah" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ gap: '0.75rem', textDecoration: 'none' }}>
                        <Github size={20} /> GitHub
                    </a>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                style={{ marginTop: '5rem', position: 'relative' }}
            >
                <div className="glass" style={{
                    padding: '2rem',
                    maxWidth: '800px',
                    margin: '0 auto',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
                        <span style={{ marginLeft: '1rem', color: 'var(--text-dim)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>noah-avalanche-sdk</span>
                    </div>
                    <code style={{ color: '#F8F8F2', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
                        <span style={{ color: '#66D9EF' }}>npm install</span> noah-avalanche-sdk
                    </code>
                </div>
            </motion.div>
        </section>
    );
};
