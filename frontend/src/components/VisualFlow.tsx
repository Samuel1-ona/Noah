import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, CreditCard, MapPin, Landmark, ShieldCheck, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface FlowNodeProps {
    icon: React.ReactNode;
    label: string;
    delay?: number;
    type: 'input' | 'output';
}

const FlowNode: React.FC<FlowNodeProps> = ({ icon, label, delay = 0, type }) => (
    <motion.div
        initial={{ opacity: 0, x: type === 'input' ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="glass"
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.5rem',
            width: '260px',
            marginBottom: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem'
        }}
    >
        <div style={{
            padding: '0.65rem',
            background: type === 'input' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            borderRadius: '0.5rem',
            color: type === 'input' ? '#3B82F6' : '#22C55E'
        }}>
            {icon}
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{label}</span>
    </motion.div>
);

export const VisualFlow: React.FC = () => {
    return (
        <section className="container" style={{ padding: '8rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>

                {/* Left: Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <FlowNode icon={<CreditCard size={20} />} label="ID Card" type="input" delay={0.1} />
                    <FlowNode icon={<MapPin size={20} />} label="Location" type="input" delay={0.3} />
                    <FlowNode icon={<Landmark size={20} />} label="Bank Account" type="input" delay={0.5} />
                </div>

                {/* Arrow Left */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.3 }}
                    transition={{ delay: 0.8 }}
                >
                    <ArrowRight size={32} />
                </motion.div>

                {/* Center: ZK Engine */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="glass"
                    style={{
                        width: '240px',
                        height: '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(5, 5, 5, 0.6)',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    {/* Pulsing Ripple Effect */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{
                            position: 'absolute',
                            width: '180px',
                            height: '180px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                            zIndex: 0
                        }}
                    />

                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{ padding: '1rem', marginBottom: '1rem', display: 'inline-block' }}
                        >
                            <Fingerprint size={64} style={{ color: '#3B82F6' }} />
                        </motion.div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>ZK Proof</h3>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>Zero-Knowledge Circuit</p>
                    </div>
                </motion.div>

                {/* Arrow Right */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.3 }}
                    transition={{ delay: 1 }}
                >
                    <ArrowRight size={32} />
                </motion.div>

                {/* Right: Outputs */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <FlowNode icon={<CheckCircle2 size={20} />} label="Verified Credential" type="output" delay={1.2} />
                    <FlowNode icon={<Lock size={20} />} label="Privacy Preserved" type="output" delay={1.4} />
                    <FlowNode icon={<ShieldCheck size={20} />} label="Compliance Approved" type="output" delay={1.6} />
                </div>

            </div>
        </section>
    );
};
