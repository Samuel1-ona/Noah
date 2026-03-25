import { useState, useEffect, useCallback } from 'react';
import { NoahBridge, type ProverPayload } from '../bridge/NoahBridge';

export interface UseNoahProverReturn {
  isReady: boolean;
  isProving: boolean;
  proof: string | null;
  error: string | null;
  generateProof: (payload: ProverPayload) => Promise<string | void>;
}

export function useNoahProver(wasmUrl: string = '/assets/noah_prover.wasm'): UseNoahProverReturn {
  const [isReady, setIsReady] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load WASM on mount
  useEffect(() => {
    let mounted = true;

    async function initWASM() {
      try {
        if (!NoahBridge.isLoaded()) {
          await NoahBridge.loadWASM(wasmUrl);
        }
        if (mounted) {
          setIsReady(true);
        }
      } catch (err: unknown) {
        if (mounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Failed to initialize WASM prover');
          }
        }
      }
    }

    initWASM();

    return () => {
      mounted = false;
    };
  }, [wasmUrl]);

  const generateProof = useCallback(async (payload: ProverPayload) => {
    if (!isReady) {
      setError('Prover is not ready yet.');
      return;
    }

    setIsProving(true);
    setError(null);
    setProof(null);

    try {
      const result = await NoahBridge.generateProof(payload);
      setProof(result);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate ZK proof');
      }
      throw err; // Re-throw to allow caller to show an alert
    } finally {
      setIsProving(false);
    }
  }, [isReady]);

  return { isReady, isProving, proof, error, generateProof };
}
