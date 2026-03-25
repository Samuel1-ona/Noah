import { Buffer } from 'buffer';
import type { NFCPassportData } from '../hooks/useNFCScanner';

declare global {
  var generateNoahProof: ((payload: string) => string) | undefined;
}

/**
 * Signature algorithm mapping for the ZK circuit
 * Must match constants in icao_9303.go: SigAlgRSA=1, SigAlgECDSA=2
 */
export const SIG_ALG_RSA = 1;
export const SIG_ALG_ECDSA = 2;

/**
 * ProverPayload is the object sent to the Noah WASM prover.
 * It maps directly onto the ICAO9303 circuit's private inputs.
 */
export interface ProverPayload {
  credentialType: 'ICAO_PASSPORT' | 'ICAO_ID_CARD' | 'NIMC_NIGERIA';
  // Raw MRZ bytes (from DG1 on chip)
  mrzData: number[];
  // RSA path inputs (leave empty for ECDSA)
  rsaSignature: number[];
  rsaModulus: number[];
  rsaPublicExp: number;
  // ECDSA path inputs (leave empty for RSA)
  ecdsaSigR: string;
  ecdsaSigS: string;
  ecdsaPubKeyX: string;
  ecdsaPubKeyY: string;
  // Selective disclosure
  minAge: number;
  currentDate: number;
  allowedJurisdictions: number[];
  sanctionedCountries: number[];
  // Wallet binding
  recipientAddress: string;
  // Which sig algorithm was used (1=RSA, 2=ECDSA)
  sigAlgorithm: number;
}

/**
 * NoahBridge converts raw NFC chip data into a format
 * the Noah WASM prover can consume to generate a ZK proof.
 */
export class NoahBridge {
  /**
   * Converts chip data from useNFCScanner into a ProverPayload.
   */
  static format(
    nfcData: NFCPassportData,
    walletAddress: string,
    minAge: number,
    allowedJurisdictions: number[] = [],
    sanctionedCountries: number[] = [],
  ): ProverPayload {
    const isECDSA = nfcData.sigAlgorithm === 'ECDSA_P256';

    return {
      credentialType: 'ICAO_PASSPORT',
      mrzData: NoahBridge.hexToBytes(nfcData.dg1),
      // RSA inputs
      rsaSignature: isECDSA ? [] : NoahBridge.hexToBytes(nfcData.sodSignature),
      rsaModulus: isECDSA ? [] : NoahBridge.extractRSAModulus(nfcData.sodPublicKey),
      rsaPublicExp: 65537, // Standard PKCS#1 exponent
      // ECDSA inputs
      ecdsaSigR: isECDSA ? NoahBridge.extractECDSAComponent(nfcData.sodSignature, 'r') : '',
      ecdsaSigS: isECDSA ? NoahBridge.extractECDSAComponent(nfcData.sodSignature, 's') : '',
      ecdsaPubKeyX: isECDSA ? NoahBridge.extractECPubKeyX(nfcData.sodPublicKey) : '',
      ecdsaPubKeyY: isECDSA ? NoahBridge.extractECPubKeyY(nfcData.sodPublicKey) : '',
      // Disclosure
      minAge,
      currentDate: NoahBridge.dateToNumber(new Date()),
      allowedJurisdictions,
      sanctionedCountries,
      recipientAddress: walletAddress,
      sigAlgorithm: isECDSA ? SIG_ALG_ECDSA : SIG_ALG_RSA,
    };
  }

  private static wasmLoaded = false;

  /**
   * Loads the WASM prover from the specified URL.
   * This must be called before generateProof.
   */
  static async loadWASM(wasmUrl: string = '/assets/noah_prover.wasm'): Promise<void> {
    if (NoahBridge.wasmLoaded) return;

    try {
      // In a real React Native environment, WASM loading might require
      // react-native-wasm or a WebView bridge, depending on engine support.
      // This assumes a standard WebAssembly global is available (e.g. Hermes/V8).
      const response = await fetch(wasmUrl);
      const buffer = await response.arrayBuffer();
      
      // We expect the Go WASM bridge (wasm_exec.js) to have already populated
      // the global WebAssembly context and started the Go instance.
      // For this bridge, we just ensure the global function is exposed.
      if (typeof globalThis.generateNoahProof !== 'function') {
        console.warn('WASM loaded but generateNoahProof not found. Ensure wasm_exec.js is initialized.');
      }
      
      NoahBridge.wasmLoaded = true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to load Noah WASM prover: ${err.message}`);
      }
      throw new Error(`Failed to load Noah WASM prover: ${String(err)}`);
    }
  }

  /** Gets whether the WASM prover is loaded and ready */
  static isLoaded(): boolean {
    return NoahBridge.wasmLoaded && typeof globalThis.generateNoahProof === 'function';
  }

  /**
   * After formatting, call this to run the WASM prover.
   * The WASM loads the compiled icao_9303.go circuit.
   */
  static async generateProof(payload: ProverPayload): Promise<string> {
    // The WASM prover is loaded from /assets/noah_prover.wasm
    // globalThis.generateNoahProof is the WASM-exported function
    if (typeof globalThis.generateNoahProof !== 'function') {
      throw new Error('Noah WASM prover not loaded. Call NoahBridge.loadWASM() first.');
    }
    const proofJson = globalThis.generateNoahProof(JSON.stringify(payload));
    return proofJson;
  }

  private static hexToBytes(hex: string): number[] {
    return Array.from(Buffer.from(hex.replace(/^0x/, ''), 'hex'));
  }

  private static extractRSAModulus(pemOrHex: string): number[] {
    // Parse DER-encoded public key for RSA modulus
    // Production implementation would use a proper ASN.1 parser
    return NoahBridge.hexToBytes(pemOrHex.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''));
  }

  private static extractECDSAComponent(sigHex: string, component: 'r' | 's'): string {
    // Parse DER-encoded ECDSA signature (r, s each 32 bytes for P-256)
    const bytes = NoahBridge.hexToBytes(sigHex);
    if (component === 'r') return Buffer.from(bytes.slice(4, 36)).toString('hex');
    return Buffer.from(bytes.slice(38, 70)).toString('hex');
  }

  private static extractECPubKeyX(pemOrHex: string): string {
    const bytes = NoahBridge.hexToBytes(pemOrHex.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''));
    return Buffer.from(bytes.slice(-64, -32)).toString('hex');
  }

  private static extractECPubKeyY(pemOrHex: string): string {
    const bytes = NoahBridge.hexToBytes(pemOrHex.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''));
    return Buffer.from(bytes.slice(-32)).toString('hex');
  }

  private static dateToNumber(date: Date): number {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return y * 10000 + m * 100 + d;
  }
}
