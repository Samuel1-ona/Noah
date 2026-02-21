import { motion } from 'framer-motion';
import { Scan, Cpu, CheckCircle } from 'lucide-react';

export const ProcessFlow: React.FC = () => {
    const steps = [
        {
            icon: <Scan size={32} />,
            title: "01. Scan & Extract",
            description: "Securely scan your passport locally. No data leaves your device."
        },
        {
            icon: <Cpu size={32} />,
            title: "02. Generate ZK Proof",
            description: "The SDK generates a Zero-Knowledge proof of your identity in your browser."
        },
        {
            icon: <CheckCircle size={32} />,
            title: "03. Verified Identity",
            description: "Protocols verify the proof on Avalanche and grant access instantly."
        }
    ];

    return (
        <section className="container" style={{ padding: '6rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>How Noah Works</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>The standard for institutional-grade private identity.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        className="glass"
                        style={{
                            padding: '2.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            border: '1px solid var(--glass-border)',
                            transition: 'border-color 0.3s ease'
                        }}
                    >
                        <div style={{
                            color: 'var(--primary)',
                            background: 'var(--primary-subtle)',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            {step.icon}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{step.title}</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.description}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
