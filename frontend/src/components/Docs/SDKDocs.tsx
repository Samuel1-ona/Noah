import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Box, Terminal, Code2, Layers, Copy, Check, ChevronRight, AlertCircle, CheckCircle2, Shield, Gamepad2, Landmark } from 'lucide-react';

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
            case 'use-cases':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Use Cases</h1>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            The Noah SDK enables a wide range of privacy-first applications. By separating identity verification from data disclosure, protocols can enforce complex rules without ever seeing personal user data.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            {[
                                {
                                    icon: <Gamepad2 size={24} />,
                                    title: "Gaming & Web3 E-Sports",
                                    desc: "Keep your leaderboards fair. Verify that each player is a unique human behind the keyboard, putting an end to multi-accounting and bots."
                                },
                                {
                                    icon: <Shield size={24} />,
                                    title: "Consumer Applications",
                                    desc: "Age-gate your content or services effortlessly. Prove your user is over 18 without asking them to upload a photo of their ID card to your servers."
                                },
                                {
                                    icon: <Landmark size={24} />,
                                    title: "DeFi & RWA Platforms",
                                    desc: "Onboard users securely. Meet strict KYC requirements while preserving your users' on-chain privacy."
                                }
                            ].map((uc, i) => (
                                <div key={i} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ color: 'var(--primary)', background: 'rgba(255,255,255,0.05)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {uc.icon}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{uc.title}</h4>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.5 }}>{uc.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'installation':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Installation</h1>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>The Noah Protocol SDK is published as `noah-avalanche-sdk`. It provides all tools necessary for ZK proof generation, MRZ extraction, and smart contract interaction.</p>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Production Install</h3>
                            <CodeBlock code="npm install noah-avalanche-sdk" label="Terminal" id="install-prod" />
                        </div>

                        <div className="glass" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={18} className="text-primary" /> Peer Dependencies
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                Noah requires `ethers` (v6) for blockchain connectivity. If you are building for the web, ensure your environment supports `WASM` for the internal prover.
                            </p>
                            <CodeBlock code='{\n  "dependencies": {\n    "noah-avalanche-sdk": "^0.1.2",\n    "ethers": "^6.10.0",\n    "framer-motion": "^11.0.0"\n  }\n}' label="package.json" id="package-deps-v2" />
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2.5rem' }}>
                            <h4 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <AlertCircle size={18} /> OS Compatibility
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                The underlying ZK library (`barretenberg`) optimized for WASM performs best on modern browsers. For Node.js environments, ensure you have sufficient memory for proof generation (&gt;4GB).
                            </p>
                        </div>
                    </motion.div>
                );
            case 'initialization':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Initialization</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Noah should be initialized once in your application's lifecycle, typically within a context provider or a dedicated hook. It requires a `signer` for write operations and an `rpcUrl` for querying the Avalanche L1.
                        </p>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Basic Setup</h3>
                            <CodeBlock
                                label="src/hooks/useNoah.ts"
                                id="init-code-v2"
                                code={`import { NoahSDK } from 'noah-avalanche-sdk';\nimport { ethers } from 'ethers';\n\n// 1. Setup your provider (e.g., MetaMask)\nconst provider = new ethers.BrowserProvider(window.ethereum);\n\n// 2. Initialize the Noah SDK\nconst sdk = new NoahSDK({\n  provider: provider,\n  rpcUrl: 'https://avax-fuji.g.alchemy.com/v2/gu3D3rKyivv6bhmb3UbyUSYxThLz7C_c' // Avalanche Fuji RPC\n});\n\n// 3. (Optional) Explicitly initialize contracts\nawait sdk.init(provider);`}
                            />
                        </div>

                        <div className="glass" style={{ padding: '1.5rem' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Configuration Options</h4>
                            <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.5rem' }}>Property</th>
                                        <th style={{ padding: '0.5rem' }}>Type</th>
                                        <th style={{ padding: '0.5rem' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)' }}>provider</td>
                                        <td style={{ padding: '0.5rem', color: 'var(--text-dim)' }}>EthersProvider</td>
                                        <td style={{ padding: '0.5rem' }}>The wallet provider for transactions.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)' }}>rpcUrl</td>
                                        <td style={{ padding: '0.5rem', color: 'var(--text-dim)' }}>string</td>
                                        <td style={{ padding: '0.5rem' }}>Your Avalanche node endpoint.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2.5rem' }}>
                            <h4 style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Terminal size={18} /> Pro Tip: Signer Handling
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                For methods that require a `signer` (like `registerCredential`), we recommend fetching the signer dynamically from the provider right before the call to ensure the user hasn't switched accounts.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'proving':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Identity Services</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Noah provides two core identity services: client-side OCR extraction and Zero-Knowledge proof generation. These services are designed to maximize privacy by keeping raw identity data on the user's device.
                        </p>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>1. Local OCR Extraction</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                The `extractPassportData` method uses `tesseract.js` to scan passport photos locally. It extracts the MRZ (Machine Readable Zone) and parses it into structured data.
                            </p>
                            <CodeBlock
                                label="Handle File Upload"
                                id="ocr-code-v2"
                                code={`// This happens entirely in the browser\nconst imageFile = e.target.files[0];\nconst extractedData = await sdk.extractPassportData(imageFile);\n\nconsole.log(extractedData.firstName); // "JONATHAN"\nconsole.log(extractedData.passportNumber); // "A2013..."`}
                            />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>2. Identity Proof Generation</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Transform raw MRZ data into a ZK proof. This example proves the user is over 18 without revealing their exact birth date to the verifier.
                            </p>
                            <CodeBlock
                                label="Generate ZK Age Proof"
                                id="proof-code-v2"
                                code={`// 1. Define proof parameters\nconst params = {\n  mrzData: extractedData,\n  minAge: 18,\n  recipientAddress: userWalletAddress\n};\n\n// 2. Generate the proof (this can take 5-10 seconds)\nconst { proof, publicSignals, credentialHash } = await sdk.api.generateAgeProof(params);\n\n// Use these results for on-chain submission\nconsole.log("Proof Hash:", credentialHash);`}
                            />
                        </div>

                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '1rem', marginTop: '2.5rem' }}>
                            <h4 style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <CheckCircle2 size={18} /> Privacy Guarantee
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Raw MRZ data is used only as a witness for the proof generation and is never stored or transmitted to Noah's servers or the blockchain.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'verifying':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>On-Chain Lifecycle</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            The final stage of integration involves interacting with the Noah smart contracts on Avalanche. You can check existing verification status and register new credentials.
                        </p>

                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>1. Address-Based Discovery</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Always check if a user is already verified when they connect their wallet. This enables the "One-Click KYC" experience.
                            </p>
                            <CodeBlock
                                label="Check Registry Status"
                                id="check-code-v2"
                                code={`const userAddress = await signer.getAddress();\n\n// Returns bytes32(0) if not found, or the existing hash if found\nconst existingHash = await sdk.contracts.getCredentialByUser(userAddress);\n\nif (existingHash !== ethers.ZeroHash) {\n  console.log("Verified User Detected!", existingHash);\n}`}
                            />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>2. Final Registration</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                This method submits the verification to the registry and binds the identity to the user's wallet address permanently.
                            </p>
                            <CodeBlock
                                label="On-Chain Submission"
                                id="submit-code-v2"
                                code={`try {\n  const tx = await sdk.contracts.registerCredential(signer, credentialHash, userAddress);\n  console.log("Transaction Hash:", tx.transactionHash);\n  \n  // Wait for 1 confirmation\n  await tx.receipt.wait();\n  console.log("Identity Registered Successfully!");\n} catch (e) {\n  // Handle "Credential already exists" if user tries to re-register\n  if (e.message.includes("Credential already exists")) {\n    handleVerifiedFlow();\n  }\n}`}
                            />
                        </div>
                    </motion.div>
                );
            case 'examples':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>API Reference</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Comprehensive breakdown of all public SDK methods.</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Method</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Namespace</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Description / Context</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "extractPassportData(file)", space: "SDK", context: "Scans MRZ lines from a passport image using local OCR." },
                                    { name: "init(provider)", space: "SDK", context: "Connects the SDK to an ethers-compatible provider." },
                                    { name: "getCredentialByUser(addr)", space: "Contracts", context: "Returns existing credential hash for a wallet address." },
                                    { name: "registerCredential(signer, hash, user)", space: "Contracts", context: "Binds a ZK credential to a wallet on-chain." },
                                    { name: "generateAgeProof(params)", space: "API", context: "Generates ZK age verification artifacts (WASM)." },
                                    { name: "hasAccess(protocol, user)", space: "Contracts", context: "Checks if a user can access a specific pool/protocol." },
                                    { name: "getRequirements(protocol)", space: "Contracts", context: "Fetches KYC rules for a specific protocol." },
                                    { name: "isCredentialValid(hash)", space: "Contracts", context: "Checks if a specific credential hash is currently active." }
                                ].map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '0.85rem' }}>{m.name}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>{m.space}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{m.context}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Need more help?</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Check out our full integration demo in `src/components/Demo/IdentityVerification.tsx` for a production-ready example of these methods in action.
                            </p>
                            <button className="btn btn-primary">Join Discord Support</button>
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
