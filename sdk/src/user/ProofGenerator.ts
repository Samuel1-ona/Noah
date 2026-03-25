/**
 * ProofGenerator - Browser-side ZK Proof Generation
 * 
 * This class manages the lifecycle of the ZK prover:
 * 1. Loading the WASM module
 * 2. Caching artifacts in IndexedDB
 * 3. Executing proofs in a Web Worker (optional but recommended)
 */

import type { ZKProof } from '../utils/types';

export type CredentialType = 'ICAO_PASSPORT' | 'ICAO_ID_CARD' | 'AADHAAR' | 'NIMC_NIGERIA';

export interface ProverInput {
  credentialType: CredentialType;
  // Common fields
  actualAge: number;
  minAge: number;
  recipientAddress: string;
  currentDate: number;

  // New ZKKYC fields
  actualJurisdiction?: number;
  actualAccredited?: number;
  credentialHash?: string;
  passportNumber?: string;
  expiryDate?: number;
  requireAccredited?: number;
  credentialHashPublic?: string;
  
  // Doc-specific fields
  mrzData?: string;
  qrData?: string;
  signature?: string;
  publicKey?: string;
  
  // Protocol requirements
  allowedJurisdictions: number[];
  sanctionedCountries: number[];
}

export interface ProofGenerationResult {
  proof: ZKProof;
  publicSignals: string[];
  success: boolean;
  nullifier: string;
  packedFlags: number;
}

export class ProofGenerator {
  private wasmLoaded: boolean = false;
  private wasmBinary: ArrayBuffer | null = null;

  constructor(private wasmUrl: string = '/noah_prover.wasm') { }

  /**
   * Load the ZK prover artifacts
   * @param overrideWasmUrl - Optional URL to override the default
   */
  async loadProver(overrideWasmUrl?: string): Promise<void> {
    if (this.wasmLoaded) return;
    const targetUrl = overrideWasmUrl || this.wasmUrl;

    try {
      // 1. Try to load from IndexedDB cache
      const cached = await this.getCachedWasm();
      if (cached) {
        this.wasmBinary = cached;
      } else {
        // 2. Download from URL
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`Failed to fetch WASM from ${targetUrl}`);
        this.wasmBinary = await response.arrayBuffer();

        // 3. Cache for next time
        await this.cacheWasm(this.wasmBinary);
      }

      this.wasmLoaded = true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to load prover: ${error.message}`);
      }
      throw new Error(`Failed to load prover: ${String(error)}`);
    }
  }

  /**
   * Generate a ZK proof locally
   * @param input - Circuit assignment data
   */
  async generateProof(input: ProverInput): Promise<ProofGenerationResult> {
    if (!this.wasmLoaded) {
      await this.loadProver();
    }

    if (typeof (globalThis as any).generateNoahProof !== 'function') {
      throw new Error('Noah WASM prover not loaded in global scope. Ensure the WASM environment is initialized.');
    }

    console.log('Generating proof locally with input:', input);

    try {
      const proofJson = await (globalThis as any).generateNoahProof(JSON.stringify(input));
      if (!proofJson) throw new Error('Received empty proof from WASM prover.');
      
      const parsed = JSON.parse(proofJson);
      
      return {
        proof: parsed.proof as ZKProof,
        publicSignals: parsed.publicSignals || [],
        nullifier: parsed.nullifier || '',
        packedFlags: parsed.packedFlags || 0,
        success: true
      };
    } catch (error: unknown) {
      let msg = 'Unknown error during proof generation';
      if (error instanceof Error) msg = error.message;
      console.error(msg);
      
      return {
        proof: { a: ["0", "0"], b: [["0", "0"], ["0", "0"]], c: ["0", "0"] } as ZKProof,
        publicSignals: [],
        nullifier: '',
        packedFlags: 0,
        success: false
      };
    }
  }

  private async getCachedWasm(): Promise<ArrayBuffer | null> {
    // Basic IndexedDB retrieval placeholder
    return null;
  }

  private async cacheWasm(binary: ArrayBuffer): Promise<void> {
    // Basic IndexedDB storage placeholder
    console.log('Caching WASM binary, size:', binary.byteLength);
  }
}
