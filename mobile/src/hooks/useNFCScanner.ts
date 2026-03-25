import { useState, useCallback } from 'react';

// Types matching what react-native-nfc-passport-reader returns
export interface NFCPassportData {
  documentNumber: string;
  dateOfBirth: string;   // YYMMDD
  dateOfExpiry: string;  // YYMMDD
  name: string;
  nationality: string;
  gender: string;
  // DG-level data for ZK proof
  dg1: string;  // MRZ bytes (hex)
  sod: string;  // Security Object Document (hex)
  sodSignature: string;  // Country DS signature (hex)
  sodPublicKey: string;  // Document Signer certificate (PEM)
  sigAlgorithm: 'RSA' | 'ECDSA_P256';
}

export type ScanStatus = 'idle' | 'scanning' | 'reading_chip' | 'success' | 'error';

export interface UseNFCScannerReturn {
  status: ScanStatus;
  passportData: NFCPassportData | null;
  error: string | null;
  startScan: (mrzKey: string) => Promise<void>;
  cancel: () => void;
}

/**
 * useNFCScanner — reads biometric passport / NIMC NFC chip
 * and returns structured data ready for the Noah ZK prover.
 *
 * @param mrzKey  BAC access key derived from MRZ: docNum + dob + expiry
 */
export function useNFCScanner(): UseNFCScannerReturn {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [passportData, setPassportData] = useState<NFCPassportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (mrzKey: string) => {
    setStatus('scanning');
    setError(null);
    setPassportData(null);

    try {
      setStatus('reading_chip');

      // Dynamic import to avoid crashes on devices without NFC
      const nfcModule = await import('react-native-nfc-passport-reader');
      const NfcPassportReader: any = nfcModule.default || nfcModule;

      const rawData: any = await NfcPassportReader.startReading({
        documentNumber: mrzKey.substring(0, 9),
        dateOfBirth: mrzKey.substring(9, 15),
        dateOfExpiry: mrzKey.substring(15, 21),
        extractPhoto: false, // We don't need the photo for ZK proofs
      });

      // Map library output → Noah passport data
      const parsed: NFCPassportData = {
        documentNumber: rawData.documentNumber,
        dateOfBirth: rawData.dateOfBirth,
        dateOfExpiry: rawData.dateOfExpiry,
        name: rawData.name || '',
        nationality: rawData.nationality || '',
        gender: rawData.gender || '',
        dg1: rawData.dg1 || '',
        sod: rawData.sod || '',
        sodSignature: rawData.sodSignature || '',
        sodPublicKey: rawData.sodPublicKey || '',
        sigAlgorithm: rawData.sigAlgorithm?.includes('EC') ? 'ECDSA_P256' : 'RSA',
      };

      setPassportData(parsed);
      setStatus('success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('NFC scan failed');
      }
      setStatus('error');
    }
  }, []);

  const cancel = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, passportData, error, startScan, cancel };
}
