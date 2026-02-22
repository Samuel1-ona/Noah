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
                            The Noah SDK is the gateway to privacy-preserving identity on Avalanche. It bridges human identity documents with the blockchain using Zero-Knowledge Proofs, allowing users to prove attributes (like age or citizenship) without revealing their personal data.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Client-Side Privacy</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Sensitive data like MRZ lines stay in the browser. ZK-Proofs are generated locally or in secure enclaves.</p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Avalanche L1 Ready</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Built-in support for multiple Avalanche subnets with automated network switching logic.</p>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Full Integration Guide</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { step: "1", title: "Initialize SDK", desc: "Connect the SDK to your wallet provider and the local Avalanche RPC." },
                                { step: "2", title: "Check Existing KYC", desc: "Immediately check if the connected address already has a registered credential to prevent redundant flows." },
                                { step: "3", title: "OCR Extraction", desc: "Scan physical documents locally using the built-in MRZ extractor." },
                                { step: "4", title: "Proof Submission", desc: "Trigger an on-chain registration that binds the identity to the user's wallet." },
                                { step: "5", title: "Track Transactions", desc: "Monitor confirmations and provide direct links to the Avalanche explorer." }
                            ].map((s) => (
                                <div key={s.step} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                                        {s.step}
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{s.title}</h4>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'installation':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Installation</h1>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>The Noah SDK is available as a private NPM package. You can link it locally during development.</p>
                        <CodeBlock code="npm install ../sdk" label="Terminal (Local Development)" id="install-local" />
                        <div className="glass" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                            <h4 style={{ marginBottom: '0.75rem' }}>Dependencies</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>The SDK requires `ethers` (v6) and `tesseract.js` for OCR functionality.</p>
                            <CodeBlock code='{\n  "dependencies": {\n    "noah-protocol-sdk": "file:../sdk",\n    "ethers": "^6.10.0"\n  }\n}' label="package.json" id="package-deps" />
                        </div>
                    </motion.div>
                );
            case 'initialization':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Initialization</h1>
                        <p style={{ marginBottom: '1.5rem' }}>Create a single instance of the SDK to manage all contract interactions:</p>
                        <CodeBlock
                            label="src/components/IdentityVerification.tsx"
                            id="init-code"
                            code={`import { NoahSDK } from 'noah-protocol-sdk';\nimport { ethers } from 'ethers';\n\nconst sdk = new NoahSDK({\n  provider: new ethers.BrowserProvider(window.ethereum),\n  rpcUrl: 'http://127.0.0.1:9650/ext/bc/noah/rpc'\n});`}
                        />
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2rem' }}>
                            <h4 style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Terminal size={18} /> Pro Tip
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Always initialize the SDK inside a `useEffect` or a state management store to ensure the provider is ready before calling contract methods.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'proving':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Identity Services</h1>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>1. Local OCR Extraction</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Extract passport MRZ data without sending images anywhere. All computation is local.</p>
                            <CodeBlock
                                label="Handle File"
                                id="ocr-code"
                                code={`const extractedData = await sdk.extractPassportData(imageFile);\nconsole.log(extractedData.passportNumber); // Returns parsed TD3 format`}
                            />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>2. Identity Proof Generation</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Generate a ZK Age proof (&gt; 18) that doesn't reveal the birth date.</p>
                            <CodeBlock
                                label="Generate Proof"
                                id="proof-code"
                                code={`// This triggers the ZK Prover engine\nconst proof = await sdk.api.generateAgeProof({\n  mrzData: extractedData,\n  minAge: 18,\n  recipientAddress: userWalletAddress\n});`}
                            />
                        </div>
                    </motion.div>
                );
            case 'verifying':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>On-Chain Lifecycle</h1>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Detection: `getCredentialByUser`</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Call this when the wallet connects to see if they're already in the Noah Registry.</p>
                            <CodeBlock
                                label="Verification Check"
                                id="check-code"
                                code={`const hash = await sdk.contracts.getCredentialByUser(account);\nif (hash !== ethers.ZeroHash) {\n  console.log("Welcome back, verified user!");\n}`}
                            />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Registration: `registerCredential`</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Submits the verification to the registry. Handles identity binding to the wallet.</p>
                            <CodeBlock
                                label="On-Chain Submission"
                                id="submit-code"
                                code={`try {\n  const res = await sdk.contracts.registerCredential(signer, hash, account);\n  console.log("Transaction:", res.transactionHash);\n} catch (e) {\n  if (e.message.includes("already exists")) handleReuse();\n}`}
                            />
                        </div>
                    </motion.div>
                );
            case 'examples':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>SDK Reference</h1>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Method</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>Namespace</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)' }}>When to call</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "extractPassportData", space: "SDK", context: "User uploads passport image" },
                                    { name: "getCredentialByUser", space: "Contracts", context: "Wallet connects (status check)" },
                                    { name: "registerCredential", space: "Contracts", context: "Final verification submission" },
                                    { name: "generateAgeProof", space: "API", context: "Generating ZK-KyC artifacts" },
                                    { name: "registerNullifier", space: "Contracts", context: "Preventing Sybil attacks on protocols" },
                                    { name: "isCredentialValid", space: "Contracts", context: "Deep validation check of a hash" }
                                ].map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '0.85rem' }}>{m.name}()</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{m.space}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>{m.context}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
