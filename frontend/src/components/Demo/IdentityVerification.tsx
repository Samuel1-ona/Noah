import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Cpu, Send, CheckCircle2, Loader2, Wallet } from 'lucide-react';

type Step = 'scan' | 'witness' | 'proof' | 'submit' | 'verified';

export const IdentityVerification: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>('scan');
    const [isProcessing, setIsProcessing] = useState(false);

    const steps: { key: Step; label: string; icon: any }[] = [
        { key: 'scan', label: 'Scan', icon: <Upload size={18} /> },
        { key: 'witness', label: 'Witness', icon: <FileText size={18} /> },
        { key: 'proof', label: 'Proof', icon: <Cpu size={18} /> },
        { key: 'submit', label: 'Submit', icon: <Send size={18} /> },
        { key: 'verified', label: 'Verified', icon: <CheckCircle2 size={18} /> },
    ];

    const handleNext = () => {
        setIsProcessing(true);
        // Simulate processing time
        setTimeout(() => {
            setIsProcessing(false);
            if (currentStep === 'scan') setCurrentStep('witness');
            else if (currentStep === 'witness') setCurrentStep('proof');
            else if (currentStep === 'proof') setCurrentStep('submit');
            else if (currentStep === 'submit') setCurrentStep('verified');
        }, 1500);
    };

    const reset = () => {
        setCurrentStep('scan');
        setIsProcessing(false);
    };

    const renderContent = () => {
        switch (currentStep) {
            case 'scan':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div className="glass" style={{
                            padding: '3rem',
                            border: '2px dashed var(--border)',
                            borderRadius: '1.5rem',
                            marginBottom: '2rem',
                            cursor: 'pointer'
                        }} onClick={handleNext}>
                            <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload Passport Photo</h3>
                            <p style={{ color: 'var(--text-dim)' }}>Drag & drop or click to pick a file</p>
                        </div>
                    </div>
                );
            case 'witness':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <FileText className="text-primary" />
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>MRZ Data Extracted</p>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>P&lt;USADUNN&lt;&lt;JONATHAN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={handleNext} disabled={isProcessing} style={{ width: '100%' }}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm Details'}
                        </button>
                    </div>
                );
            case 'proof':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <Cpu size={64} className={isProcessing ? "animate-pulse" : ""} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Generating ZK Proof</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Proving age {'>'} 18 without revealing birth date...</p>
                        </div>
                        {isProcessing ? (
                            <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1.5 }}
                                    style={{ height: '100%', background: 'var(--primary)' }}
                                />
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%' }}>
                                Finish Proving
                            </button>
                        )}
                    </div>
                );
            case 'submit':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                <Wallet size={20} /> <span style={{ fontFamily: 'var(--font-mono)' }}>0x71C...a291</span>
                            </div>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>You are about to submit your ZK Proof to ProtocolAccessControl on Avalanche.</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleNext} disabled={isProcessing} style={{ width: '100%' }}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Submit Proof to Chain'}
                        </button>
                    </div>
                );
            case 'verified':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <CheckCircle2 size={72} style={{ color: '#22C55E', marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Verified!</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your reusable identity is now active on Avalanche.</p>
                        <button className="btn btn-outline" onClick={reset} style={{ width: '100%' }}>
                            Start Over
                        </button>
                    </div>
                );
        }
    };

    return (
        <section className="container" style={{ padding: '4rem 0' }}>
            <div className="glass" style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '3rem',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                border: '1px solid var(--border)'
            }}>
                {/* Stepper Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'var(--border)', transform: 'translateY(-50%)', zIndex: 0 }} />
                    {steps.map((step, i) => {
                        const isActive = currentStep === step.key;
                        const isCompleted = steps.findIndex(s => s.key === currentStep) > i;

                        return (
                            <div key={step.key} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: isCompleted || isActive ? 'var(--primary)' : 'var(--bg-dark)',
                                    border: `2px solid ${isActive || isCompleted ? 'var(--primary)' : 'var(--border)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isCompleted || isActive ? 'white' : 'var(--text-dim)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {step.icon}
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? 'var(--primary)' : 'var(--text-dim)' }}>{step.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};
