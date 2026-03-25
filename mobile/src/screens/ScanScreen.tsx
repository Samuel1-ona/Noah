import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { useNFCScanner, type NFCPassportData } from '../hooks/useNFCScanner';
import { NoahBridge } from '../bridge/NoahBridge';
import { useNoahProver } from '../hooks/useNoahProver';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready to scan',
  scanning: 'Hold your ID/Passport to the back of your phone…',
  reading_chip: 'Reading chip data. Keep your document still.',
  success: 'Identity data read successfully!',
  error: 'Scan failed. Please try again.',
};

const STATUS_COLORS: Record<string, string> = {
  idle: '#6B7280',
  scanning: '#F59E0B',
  reading_chip: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
};

interface ScanScreenProps {
  walletAddress: string;
  minAge?: number;
  onProofGenerated?: (proofJson: string) => void;
}

export function ScanScreen({
  walletAddress,
  minAge = 18,
  onProofGenerated,
}: ScanScreenProps) {
  const { status, passportData, error: scanError, startScan, cancel } = useNFCScanner();
  const [mrzKey, setMrzKey] = useState('');
  
  // Use the hook to handle WASM loading and proof generation
  const { isReady, isProving, error: proverError, generateProof } = useNoahProver('/assets/noah_prover.wasm');

  const handleScan = useCallback(async () => {
    if (!mrzKey || mrzKey.length < 21) {
      Alert.alert('Invalid MRZ Key', 'Please enter or scan the 21-character BAC access key.');
      return;
    }
    await startScan(mrzKey);
  }, [mrzKey, startScan]);

  const handleGenerateProof = useCallback(async (data: NFCPassportData) => {
    if (!isReady) {
      Alert.alert('Not Ready', 'WASM prover is still loading.');
      return;
    }
    
    try {
      const payload = NoahBridge.format(data, walletAddress, minAge);
      
      // The hook handles 'isProving' and 'proof' state internally if we wanted to display the raw JSON
      const proofResult = await generateProof(payload);
      
      if (proofResult) {
        // Assuming success if it doesn't throw
        Alert.alert('Success', 'ZK Proof generated! Ready to submit to Avalanche.');
        onProofGenerated?.(proofResult);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert('Proof Error', err.message);
      } else {
        Alert.alert('Proof Error', 'An unknown error occurred');
      }
    }
  }, [walletAddress, minAge, isReady, generateProof, onProofGenerated]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Noah Identity</Text>
      <Text style={styles.subtitle}>Scan your government ID to prove your identity privately.</Text>

      {/* BAC Key Input */}
      <View style={styles.card}>
        <Text style={styles.label}>MRZ Access Key (from document scan)</Text>
        <TextInput
          style={styles.input}
          value={mrzKey}
          onChangeText={setMrzKey}
          placeholder="e.g. P1234567XNGA8506012M251231"
          placeholderTextColor="#6B7280"
          autoCapitalize="characters"
          maxLength={21}
        />
      </View>

      {/* Status Indicator */}
      <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[status] }]}>
        {(status === 'scanning' || status === 'reading_chip') && (
          <ActivityIndicator color={STATUS_COLORS[status]} size="small" style={styles.spinner} />
        )}
        <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
          {STATUS_LABELS[status]}
        </Text>
      </View>

      {scanError && <Text style={styles.errorText}>{scanError}</Text>}
      {proverError && <Text style={styles.errorText}>{proverError}</Text>}

      {/* Action Buttons */}
      <TouchableOpacity
        style={[styles.button, (status === 'scanning' || status === 'reading_chip') && styles.buttonDisabled]}
        onPress={handleScan}
        disabled={status === 'scanning' || status === 'reading_chip'}
      >
        <Text style={styles.buttonText}>
          {status === 'idle' || status === 'error' ? '📱 Start NFC Scan' : 'Scanning…'}
        </Text>
      </TouchableOpacity>

      {status === 'scanning' && (
        <TouchableOpacity style={styles.cancelButton} onPress={cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Result card on success */}
      {status === 'success' && passportData && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>✅ Chip Data Read</Text>
          <Text style={styles.resultRow}>🌍 Nationality: {passportData.nationality}</Text>
          <Text style={styles.resultRow}>🔐 Sig Algorithm: {passportData.sigAlgorithm}</Text>
          <Text style={styles.resultRow}>📅 Expires: {passportData.dateOfExpiry}</Text>

          <TouchableOpacity
            style={[styles.button, styles.proofButton]}
            onPress={() => handleGenerateProof(passportData)}
            disabled={isProving || !isReady}
          >
            {isProving 
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>
                  {!isReady ? '⏳ Loading Prover...' : '⚡ Generate ZK Proof'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.privacy}>
        🔒 Your document data never leaves your device. Only a cryptographic proof is sent on-chain.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#F3F4F6', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24, lineHeight: 20 },
  card: { backgroundColor: '#1E1E2E', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { color: '#9CA3AF', fontSize: 12, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#2A2A3E',
    color: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  spinner: { marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  cancelText: { color: '#EF4444', fontSize: 14 },
  resultCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#10B981', marginBottom: 10 },
  resultRow: { color: '#D1D5DB', fontSize: 13, marginBottom: 6, lineHeight: 18 },
  proofButton: { backgroundColor: '#059669', marginTop: 12, marginBottom: 0 },
  privacy: { color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 16 },
});
