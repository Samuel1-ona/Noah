import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Box, Terminal, Code2, Layers, Copy, Check, ChevronRight } from 'lucide-react';

type Section = 'overview' | 'use-cases' | 'installation' | 'initialization' | 'proving' | 'verifying' | 'examples';

export const SDKDocs: React.FC = () => {
    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const sidebarItems: { id: Section; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: <BookOpen size={18} /> },
        { id: 'use-cases', label: 'Use Cases', icon: <Layers size={18} /> },
        { id: 'installation', label: 'Installation', icon: <Box size={18} /> },
        { id: 'initialization', label: 'Initialization', icon: <Terminal size={18} /> },
        { id: 'proving', label: 'Proof Generation', icon: <Code2 size={18} /> },
        { id: 'verifying', label: 'On-Chain Verification', icon: <Layers size={18} /> },
        { id: 'examples', label: 'Examples', icon: <Code2 size={18} /> },
    ];

    const CodeBlock = ({ code, label, id }: { code: string; label: string; id: string }) => (
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.5rem 1rem',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                <button
                    onClick={() => copyToClipboard(code, id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                    {copied === id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
            </div>
            <pre style={{
                margin: 0,
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.3)',
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: '#f8f8f2'
            }}>
                <code>{code}</code>
            </pre>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Noah SDK Overview</h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                            The Noah SDK is a client-side library that enables developers to integrate privacy-preserving identity verification into Gaming, Consumer Apps, and DeFi protocols on Avalanche.
                            It handles complex cryptographic operations locally, ensuring user data never leaves their device.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>Privacy First</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Zero-Knowledge Proofs ensure that only the result of the verification is shared, not the raw data.</p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>Avalanche Native</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Optimized for the Avalanche C-Chain with minimal gas footprints and fast settlement.</p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'use-cases':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Use Cases</h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            Discover how Noah's privacy-preserving ZK-Identity can transform your application.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="glass" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ background: 'var(--primary-subtle)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                        <Code2 className="text-primary" size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Gaming & Web3 E-Sports</h3>
                                </div>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                    Keep your leaderboards fair. Verify that each player is a unique human behind the keyboard, putting an end to multi-accounting and bots.
                                </p>
                            </div>

                            <div className="glass" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ background: 'var(--primary-subtle)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                        <Layers className="text-primary" size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Consumer Applications</h3>
                                </div>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                    Age-gate your content or services effortlessly. Prove your user is over 18 without asking them to upload a photo of their ID card to your servers.
                                </p>
                            </div>

                            <div className="glass" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ background: 'var(--primary-subtle)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                        <Box className="text-primary" size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>DeFi & RWA Platforms</h3>
                                </div>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                    Onboard users securely. Meet strict KYC requirements while preserving your users' on-chain privacy.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'installation':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Installation</h1>
                        <p style={{ marginBottom: '1.5rem' }}>Install the Noah SDK using your favorite package manager:</p>
                        <CodeBlock code="npm install noah-avalanche-sdk" label="Terminal" id="install-npm" />
                        <CodeBlock code="yarn add noah-avalanche-sdk" label="Terminal" id="install-yarn" />
                    </motion.div>
                );
            case 'initialization':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Initialization</h1>
                        <p style={{ marginBottom: '1.5rem' }}>Initialize the SDK with an EIP-1193 provider (like MetaMask):</p>
                        <CodeBlock
                            label="src/App.tsx"
                            id="init-code"
                            code={`import { NoahSDK } from 'noah-avalanche-sdk';\n\nconst sdk = new NoahSDK({\n  provider: window.ethereum,\n  rpcUrl: 'http://127.0.0.1:9650/ext/bc/noah/rpc' // Local L1\n});`}
                        />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem' }}>Local Contract Addresses</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Use these addresses for testing on your local Avalanche L1:</p>
                        <div className="glass" style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>CredentialRegistry</span>
                                <span style={{ color: 'var(--primary)' }}>0x17aB05351fC94a1a67Bf3f56DdbB941aE6c63E25</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>ZKVerifier</span>
                                <span style={{ color: 'var(--primary)' }}>0x52C84043CD9c865236f11d9Fc9F56aa003c1f922</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-dim)' }}>ProtocolAccessControl</span>
                                <span style={{ color: 'var(--primary)' }}>0x5aa01B3b5877255cE50cc55e8986a7a5fe29C70e</span>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'proving':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Proof Generation</h1>
                        <p style={{ marginBottom: '1.5rem' }}>Extract passport data and generate a ZK proof locally:</p>
                        <CodeBlock
                            label="src/App.tsx"
                            id="proving-code"
                            code={`// 1. Extract data via OCR\nconst mrzData = await sdk.extractPassportData(imageFile);\n\n// 2. Generate age verification proof (> 18)\nconst proof = await sdk.proveAge(mrzData, 18);\n\nconsole.log("Proof Generated:", proof.signals);`}
                        />
                    </motion.div>
                );
            case 'verifying':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>On-Chain Verification</h1>
                        <p style={{ marginBottom: '1.5rem' }}>Submit the proof to the `ProtocolAccessControl` contract on Avalanche:</p>
                        <CodeBlock
                            label="src/App.tsx"
                            id="verify-code"
                            code={`const protocolAddress = "0x...";\n\ntry {\n  const tx = await sdk.grantAccess(protocolAddress, proof);\n  await tx.wait();\n  console.log("Access Granted!");\n} catch (error) {\n  console.error("Verification failed", error);\n}`}
                        />
                    </motion.div>
                );
            case 'examples':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Integration Examples</h1>
                        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Age-Gated DeFi Lending</h3>
                            <p style={{ marginBottom: '1.5rem' }}>Learn how to restrict your lending pool to verified users over 18 without revealing their identity.</p>
                            <button className="btn btn-outline" style={{ fontSize: '0.875rem' }}>View GitHub Example</button>
                        </div>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Sybil-Resistant Airdrop</h3>
                            <p style={{ marginBottom: '1.5rem' }}>Ensure unique users participate in your airdrop using Noah's global nullifiers.</p>
                            <button className="btn btn-outline" style={{ fontSize: '0.875rem' }}>View GitHub Example</button>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', position: 'relative' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                borderRight: '1px solid var(--border)',
                padding: '2rem',
                flexShrink: 0
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>Documentation</span>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: activeSection === item.id ? 'var(--primary-subtle)' : 'transparent',
                                color: activeSection === item.id ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontWeight: activeSection === item.id ? 600 : 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {item.icon}
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {activeSection === item.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '4rem 6rem', maxWidth: '1000px' }}>
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};
