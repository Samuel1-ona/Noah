import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Box, Terminal, Code2, Layers, Copy, Check, ChevronRight, AlertCircle, CheckCircle2, Shield, Gamepad2 } from 'lucide-react';

type Section =
    | 'overview' | 'concepts' | 'architecture' | 'quickstart' | 'installation'
    | 'authentication' | 'initialization' | 'features' | 'methods' | 'events'
    | 'api-ref' | 'errors' | 'security' | 'changelog' | 'faq' | 'support';

export const SDKDocs: React.FC = () => {
    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const sidebarItems: { id: Section; label: string; icon: any }[] = [
        { id: 'overview', label: '1. Product Overview', icon: <BookOpen size={18} /> },
        { id: 'concepts', label: '2. Key Concepts', icon: <Layers size={18} /> },
        { id: 'architecture', label: '3. Architecture', icon: <Box size={18} /> },
        { id: 'quickstart', label: '4. Quickstart', icon: <Terminal size={18} /> },
        { id: 'installation', label: '5. Installation', icon: <Box size={18} /> },
        { id: 'authentication', label: '6. Authentication', icon: <Shield size={18} /> },
        { id: 'initialization', label: '7. SDK Initialization', icon: <Code2 size={18} /> },
        { id: 'features', label: '8. Core Features', icon: <Layers size={18} /> },
        { id: 'methods', label: '9. Method Reference', icon: <Terminal size={18} /> },
        { id: 'events', label: '10. Events', icon: <Code2 size={18} /> },
        { id: 'api-ref', label: '11. API Reference', icon: <Layers size={18} /> },
        { id: 'errors', label: '14. Error Handling', icon: <AlertCircle size={18} /> },
        { id: 'security', label: '15. Security', icon: <Shield size={18} /> },
        { id: 'changelog', label: '20. Changelog', icon: <BookOpen size={18} /> },
        { id: 'faq', label: '21. FAQ', icon: <BookOpen size={18} /> },
        { id: 'support', label: '22. Support', icon: <Gamepad2 size={18} /> },
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
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Product Overview</h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '1.5rem' }}>"Verify Once, Use Everywhere."</p>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>What is Noah?</h3>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                                Noah is a privacy-first identity infrastructure for the modern web. We enable applications to verify their users' real-world identity (like age, nationality, or accreditation) without ever actually seeing their private documents.
                            </p>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                If you've ever felt <strong>"KYC Fatigue"</strong>—the annoyance of uploading your passport to ten different apps—Noah is the solution. Users verify once, and their identity becomes a portable, secure badge they can carry across the entire Avalanche ecosystem.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>The Core Problem</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Traditional KYC is slow, invasive, and repetitive. Developers hate managing PII, and users hate sharing it.</p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>The Noah Solution</h4>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>We use Zero-Knowledge Proofs to "vouch" for a user. Your app gets the "Yes/No" answer it needs, while the user keeps their data.</p>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2rem', border: '1px solid var(--primary-subtle)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Who is this for?</h4>
                            <ul style={{ color: 'var(--text-dim)', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} className="text-primary" /> <strong>DeFi Protocols</strong> needing to restrict access by age or region.</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} className="text-primary" /> <strong>Web3 Games</strong> preventing botting and multi-accounting.</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} className="text-primary" /> <strong>RWA Platforms</strong> requiring accredited investor verification.</li>
                            </ul>
                        </div>
                    </motion.div>
                );
            case 'concepts':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Key Concepts</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            Before diving into the code, let's look at the three main pillars that make Noah work. Think of these as the "Mental Model" for your integration.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {[
                                {
                                    title: "1. Identity Nullifier",
                                    desc: "This is a unique, anonymous fingerprint of a user's document. It allows us to ensure that one passport cannot be used to verify ten different wallets, preventing 'Sybil attacks' without revealing who the person is.",
                                    analogy: "Like a unique wax seal on an envelope—you know it's authentic, but you don't know the contents."
                                },
                                {
                                    title: "2. Zero-Knowledge Proof (ZKP)",
                                    desc: "A ZKP is a mathematical way to prove you know a secret without telling the secret. In Noah, we use 'Groth16' proofs generated right in the user's browser (WASM).",
                                    analogy: "Like showing a '18+' wristband at a club instead of handing over your actual birth certificate."
                                },
                                {
                                    title: "3. Wallet Binding",
                                    desc: "Once a user is verified, their identity is cryptographically 'bound' to their wallet address on the CredentialRegistry. This makes their verification status portable across any app that uses the Noah SDK.",
                                    analogy: "Like linking your driver's license to your digital car key—once it's linked, the car just opens."
                                }
                            ].map((c, i) => (
                                <div key={i} className="glass" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>{c.title}</h3>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>{c.desc}</p>
                                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', fontSize: '0.9rem', borderLeft: '4px solid var(--primary)' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Human Analogy:</span> {c.analogy}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'architecture':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Architecture Overview</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            Noah isn't just a database; it's a three-layer system designed for maximum privacy. Here is how the "Magic" happens technically.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="glass" style={{ padding: '2rem' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Layers size={20} className="text-primary" /> The Application Layer
                                </h4>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                                    This is where you live. You integrate the <strong>Noah SDK</strong> into your frontend. The SDK provides a ready-made UI component that talks to the user's camera, extracts their info, and handles the complicated math in the background. No backend work required on your side.
                                </p>
                            </div>

                            <div className="glass" style={{ padding: '2rem' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Terminal size={20} className="text-primary" /> The Verification Layer (Local WASM)
                                </h4>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                                    This is the "Brain." When a user scans a document, the <strong>OCR Engine</strong> reads it locally. Then, the <strong>Gnark-WASM Prover</strong> generates a ZK Proof.
                                    <br /><br />
                                    <strong style={{ color: 'var(--primary)' }}>Crucially:</strong> The raw passport data never leaves the user's browser. Only the finished "Proof" travels to the next layer.
                                </p>
                            </div>

                            <div className="glass" style={{ padding: '2rem' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Box size={20} className="text-primary" /> The On-Chain Layer (Avalanche)
                                </h4>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                                    The "Registry." The ZK Proof is sent to our <strong>CredentialRegistry</strong> smart contract on Avalanche. Our <strong>ZKVerifier</strong> contract checks the math. If it's valid, we store a permanent "Verified" status for that wallet address.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'quickstart':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Developer Quickstart</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            Want to get Noah running in under 5 minutes? Follow this simple flow. We've designed the SDK to be as "Plug and Play" as possible.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Step 1: Install</h3>
                                <CodeBlock code="npm install noah-avalanche-sdk" label="Terminal" id="quick-install" />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Step 2: Initialize</h3>
                                <CodeBlock code={`import { NoahSDK } from 'noah-avalanche-sdk';\n\nconst sdk = new NoahSDK({\n  rpcUrl: 'https://api.avax-fuji.network/ext/bc/C/rpc'\n});`} label="Javascript" id="quick-init" />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Step 3: Verification Magic</h3>
                                <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.9rem' }}>The `proveAndGrant` method handles OCR, ZK-Proof generation, and on-chain registration in one single call.</p>
                                <CodeBlock code={`const tx = await sdk.proveAndGrant(\n  signer, \n  protocolAddress, \n  mrzData, \n  18 // Minimum Age Requirement\n);`} label="Javascript" id="quick-magic" />
                            </div>
                        </div>

                        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><CheckCircle2 size={18} className="text-primary" /> Success!</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You've just integrated reusable, privacy-preserving identity. Your users are now "Verified" across the Noah ecosystem.</p>
                        </div>
                    </motion.div>
                );
            case 'installation':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Installation Guide</h1>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Noah is distributed as a lightweight npm package. We support all major package managers and modern frontend frameworks.</p>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>NPM</h3>
                            <CodeBlock code="npm install noah-avalanche-sdk" label="Terminal" id="install-npm" />

                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', marginTop: '1.5rem' }}>Yarn</h3>
                            <CodeBlock code="yarn add noah-avalanche-sdk" label="Terminal" id="install-yarn" />
                        </div>

                        <div className="glass" style={{ padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem' }}>Requirements</h4>
                            <ul style={{ fontSize: '0.875rem', color: 'var(--text-dim)', paddingLeft: '1.2rem' }}>
                                <li><strong>Environment:</strong> Modern Browser (Chrome, Firefox, Safari) or Node.js 18+.</li>
                                <li><strong>Dependencies:</strong> `ethers` v6 is required for blockchain interactions.</li>
                                <li><strong>WASM Support:</strong> Ensure your environment defaults allow WebAssembly execution.</li>
                            </ul>
                        </div>
                    </motion.div>
                );
            case 'authentication':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Authentication</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            Before a user can prove their identity, they must connect their wallet. Noah uses standard Ethers.js signers to bind identity to a specific address.
                        </p>

                        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Ethers.js / MetaMask</h3>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                                The SDK expects an Ethers `Signer`. If you are using standard MetaMask or local providers, you can grab the signer like this:
                            </p>
                            <CodeBlock
                                code={`const provider = new ethers.BrowserProvider(window.ethereum);\nconst signer = await provider.getSigner();`}
                                label="Javascript"
                                id="auth-signer"
                            />
                        </div>

                        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Using Privy</h3>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                                Noah works perfectly with Privy. Simply use the Privy provider to get an Ethers-compatible signer.
                            </p>
                            <CodeBlock
                                code={`const provider = await user.getEthersProvider();\nconst signer = await provider.getSigner();`}
                                label="Javascript"
                                id="auth-privy"
                            />
                        </div>
                    </motion.div>
                );
            case 'initialization':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>SDK Initialization</h1>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Setting up Noah is straightforward. You typically want to initialize it once at the top level of your app.
                        </p>

                        <CodeBlock
                            label="Initialization"
                            id="init-guide-code"
                            code={`import { NoahSDK } from 'noah-avalanche-sdk';\n\nconst sdk = new NoahSDK({\n  // Required: The Avalanche network RPC\n  rpcUrl: 'https://api.avax-fuji.network/ext/bc/C/rpc',\n  \n  // Optional: Your backend API URL for proof generation\n  baseURL: 'https://api.noah-protocol.com/v1'\n});`}
                        />

                        <div style={{ marginTop: '2.5rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Configuration Options</h4>
                            <div className="glass" style={{ padding: '0.5rem', overflowX: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '1rem' }}>Parameter</th>
                                            <th style={{ padding: '1rem' }}>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>rpcUrl</td>
                                            <td style={{ padding: '1rem' }}>The Avalanche RPC endpoint. Use Fuji for testing.</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>baseURL</td>
                                            <td style={{ padding: '1rem' }}>Optional custom endpoint for the Noah Proof API.</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>timeout</td>
                                            <td style={{ padding: '1rem' }}>API request timeout in milliseconds (Default: 30,000).</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'features':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Core Features</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            The Noah SDK is more than just a camera scanner. It's a full-suite identity toolkit for the decentralized web.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Robust OCR Extraction</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                    Our scanner isn't picky. We use check-digit auto-correction to fix blurry scans and lens distortion, ensuring a "First Time Success" for your users.
                                </p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>ZK Proof Generation</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                    Generate mathematical proofs locally using WASM. Prove age or residency without exposing the underlying document data.
                                </p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>On-Chain Binding</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                    One-click registration on Avalanche binds an identity to a wallet address permanently and securely.
                                </p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Access Control</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                    Easily restrict your protocol features to users who meet specific KYC requirements (like min age or allowed regions).
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'methods':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Method Reference</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                            A detailed guide to every function you'll need to build a professional identity flow.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            {/* NoahSDK Methods */}
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Main SDK Client</h2>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>extractPassportData(image)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>The "Eyes" of the SDK. Scans a passport image and extracts the MRZ data locally.</p>
                                    <ul style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                        <li><strong>Params:</strong> `File | string | Blob` (The document image)</li>
                                        <li><strong>Returns:</strong> `Promise{"<"}MRZData{">"}` (Parsed identity attributes)</li>
                                    </ul>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>proveAndGrant(signer, protocol, data, age)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>The "Magic Button." Generates a proof and registers the user on-chain in one step.</p>
                                    <ul style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                        <li><strong>Params:</strong> Ethers Signer, Protocol Addr, MRZ Data, Min Age</li>
                                        <li><strong>Returns:</strong> `Promise{"<"}TransactionResult{">"}`</li>
                                    </ul>
                                </div>
                            </div>

                            {/* ContractClient Methods */}
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Contract Client (`sdk.contracts`)</h2>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>isCredentialValid(hash)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Checks if a specific identity badge is still active and hasn't been revoked.</p>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>hasAccess(protocol, user)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>The ultimate check. Returns `true` if the user is verified for your app.</p>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>getRequirements(protocol)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Fetches the KYC rules you've set for your protocol (e.g., Min Age 21).</p>
                                </div>
                            </div>

                            {/* UserClient Methods */}
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>User Client (High-Level API)</h2>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>proveFromImage(image, requirements)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Complete flow: OCR {"->"} Parse {"->"} ZK-Proof generation.</p>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>verifyAndGrantAccess(proofResult)</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>Submits a finished ZK proof result to the Avalanche network.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'events':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Events</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                            Stay informed about what's happening during the verification flow. The SDK emits events you can listen to for UI updates.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>CredentialRegistered</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Emitted when a new identity is successfully bound to a wallet on-chain.</p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>OCR_STARTED / OCR_COMPLETED</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Track the progress of the passport scanning phase.</p>
                            </div>
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>PROOF_GENERATION_PENDING</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>The user is generating the ZK math. This is a great time to show a "Generating Magic" loader.</p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'api-ref':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>API Reference Table</h1>
                        <div className="glass" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '1rem' }}>Method</th>
                                        <th style={{ padding: '1rem' }}>Namespace</th>
                                        <th style={{ padding: '1rem' }}>Goal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: "extractPassportData", space: "Core", goal: "Read MRZ lines from image" },
                                        { name: "init", space: "Core", goal: "Link wallet & RPC" },
                                        { name: "registerCredential", space: "Contracts", goal: "Bind identity to wallet" },
                                        { name: "isCredentialValid", space: "Contracts", goal: "Check if user is verified" },
                                        { name: "generateProof", space: "API", goal: "Create ZK math artifacts" },
                                    ].map((m, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{m.name}</td>
                                            <td style={{ padding: '1rem' }}>{m.space}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-dim)' }}>{m.goal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );
            case 'errors':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Error Handling</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>When things go wrong, we try to be as human as possible about it.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                {
                                    code: "VALIDATION_ERROR",
                                    msg: "We couldn't read the passport lines or the user doesn't meet requirements.",
                                    fix: "Ask the user to ensure good lighting. If the error persists, check that the user meets the protocol's age/region rules."
                                },
                                {
                                    code: "PROVER_ERROR",
                                    msg: "The ZK proof generation failed.",
                                    fix: "Usually caused by invalid passport data (e.g., expired document) or a connection timeout with the Prover API."
                                },
                                {
                                    code: "INTERNAL_ERROR",
                                    msg: "A generic system or contract error occurred.",
                                    fix: "Check the 'message' property for details. This often happens if an identity is already registered on Avalanche."
                                }
                            ].map((e, i) => (
                                <div key={i} className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid #EF4444' }}>
                                    <h4 style={{ fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>{e.code}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>{e.msg}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}><strong>How to fix:</strong> {e.fix}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'security':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Security Guideline</h1>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Your Privacy, Guaranteed</h3>
                            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                Security isn't just a checkbox; it's our entire reason for being. Here's how we keep your users safe:
                            </p>
                            <ul style={{ color: 'var(--text-dim)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0 }}>
                                <li style={{ display: 'flex', gap: '0.75rem' }}><Shield size={20} className="text-primary" /> <strong>Zero Data Transmission:</strong> Raw passport images and data never leave the browser.</li>
                                <li style={{ display: 'flex', gap: '0.75rem' }}><Shield size={20} className="text-primary" /> <strong>WASM Sandboxing:</strong> Proof generation happens in a sandboxed WebAssembly environment.</li>
                                <li style={{ display: 'flex', gap: '0.75rem' }}><Shield size={20} className="text-primary" /> <strong>On-Chain Integrity:</strong> Verification is handled by audited smart contracts on Avalanche.</li>
                            </ul>
                        </div>
                    </motion.div>
                );
            case 'changelog':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Changelog</h1>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Noah v0.1.6</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>March 2026</p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'faq':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>FAQ</h1>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                { q: "Does Noah store my passport?", a: "No. We only store a cryptographic proof and an anonymous nullifier on-chain." },
                                { q: "Which passports are supported?", a: "We support over 140 countries using the ICAO 9303 standard." },
                                { q: "What if my verification fails?", a: "Try again in a better lit room. Most failures are due to glare on the document." }
                            ].map((f, i) => (
                                <div key={i} className="glass" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>{f.q}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{f.a}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'support':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Support {"&"} Community</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '3rem' }}>
                            Stuck? Need a feature? Or just want to say hi? We're here for you.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                                <Gamepad2 size={48} className="text-primary" style={{ margin: '0 auto 1.5rem' }} />
                                <h3 style={{ marginBottom: '1rem' }}>Discord</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Join 5,000+ developers building with Noah.</p>
                                <button className="btn btn-primary" style={{ width: '100%' }}>Join Discord</button>
                            </div>
                            <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                                <Terminal size={48} className="text-primary" style={{ margin: '0 auto 1.5rem' }} />
                                <h3 style={{ marginBottom: '1rem' }}>GitHub</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Report bugs or contribute to our SDK.</p>
                                <button className="btn btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid var(--primary)' }}>Open Issue</button>
                            </div>
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
