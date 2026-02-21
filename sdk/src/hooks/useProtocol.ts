import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import type { Signer } from 'ethers';
import { ProtocolClient } from '../protocol/ProtocolClient';
import type { Requirements, TransactionResult } from '../utils/types';

/**
 * Configuration options for useProtocol hook
 */
export interface UseProtocolOptions {
  /** Protocol contract address (optional, defaults to signer address) */
  protocolAddress?: string;
  /** User address to check access for */
  userAddress?: string;
  /** Whether to enable automatic refetching */
  enabled?: boolean;
  /** React Query configuration options */
  queryOptions?: {
    refetchInterval?: number;
    staleTime?: number;
  };
}

/**
 * Return type for useProtocol hook
 */
export interface UseProtocolReturn {
  // Protocol client instance
  protocol: ProtocolClient | null;
  
  // Read operations
  requirements: Requirements | undefined;
  isLoadingRequirements: boolean;
  requirementsError: Error | null;
  refetchRequirements: () => void;
  
  // Access checking
  hasAccess: boolean | undefined;
  isLoadingAccess: boolean;
  accessError: Error | null;
  refetchAccess: () => void;
  
  // Write operations (mutations)
  setRequirements: {
    mutate: (params: {
      minAge: number;
      jurisdictions: string[];
      requireAccredited: boolean;
    }) => void;
    mutateAsync: (params: {
      minAge: number;
      jurisdictions: string[];
      requireAccredited: boolean;
    }) => Promise<TransactionResult>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
  
  verifyAndGrantAccess: {
    mutate: (params: {
      proof: {
        a: [string, string];
        b: [[string, string], [string, string]];
        c: [string, string];
      };
      publicSignals: string[];
      credentialHash: string;
      userAddress: string;
    }) => void;
    mutateAsync: (params: {
      proof: {
        a: [string, string];
        b: [[string, string], [string, string]];
        c: [string, string];
      };
      publicSignals: string[];
      credentialHash: string;
      userAddress: string;
    }) => Promise<TransactionResult>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
}

/**
 * React hook for protocol operations
 * 
 * Provides easy access to protocol-related functionality including:
 * - Getting and setting protocol requirements
 * - Checking user access
 * - Verifying proofs and granting access
 * 
 * @param signer - Ethers signer instance (from wallet)
 * @param options - Configuration options
 * @returns Hook return object with protocol operations
 * 
 * @example
 * ```tsx
 * import { useProtocol } from '@noah-protocol/sdk/hooks';
 * import { useSigner } from 'wagmi';
 * 
 * function ProtocolDashboard() {
 *   const { data: signer } = useSigner();
 *   const { 
 *     requirements, 
 *     setRequirements,
 *     hasAccess 
 *   } = useProtocol(signer, {
 *     protocolAddress: '0x...',
 *     userAddress: '0x...'
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={() => setRequirements.mutate({
 *         minAge: 21,
 *         jurisdictions: ['US', 'UK'],
 *         requireAccredited: true
 *       })}>
 *         Set Requirements
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProtocol(
  signer: Signer | null | undefined,
  options: UseProtocolOptions = {}
): UseProtocolReturn {
  const {
    protocolAddress,
    userAddress,
    enabled = true,
    queryOptions = {},
  } = options;

  const queryClient = useQueryClient();

  // Create protocol client instance
  const protocol = useMemo(() => {
    if (!signer) return null;
    try {
      return new ProtocolClient(signer);
    } catch (error) {
      console.warn('ProtocolClient not available:', error);
      return null;
    }
  }, [signer]);

  // Get current protocol address (use signer address if not provided)
  const [currentProtocolAddress, setCurrentProtocolAddress] = useState<string | undefined>(protocolAddress);
  
  useEffect(() => {
    if (protocolAddress) {
      setCurrentProtocolAddress(protocolAddress);
    } else if (signer) {
      signer.getAddress()
        .then(address => setCurrentProtocolAddress(address))
        .catch(() => setCurrentProtocolAddress(undefined));
    } else {
      setCurrentProtocolAddress(undefined);
    }
  }, [protocolAddress, signer]);

  // Query: Get protocol requirements
  const {
    data: requirements,
    isLoading: isLoadingRequirements,
    error: requirementsError,
    refetch: refetchRequirements,
  } = useQuery({
    queryKey: ['protocol', 'requirements', currentProtocolAddress],
    queryFn: async () => {
      if (!protocol || !currentProtocolAddress) {
        throw new Error('Protocol client or address not available');
      }
      return protocol.getRequirements(currentProtocolAddress);
    },
    enabled: enabled && !!protocol && !!currentProtocolAddress,
    ...queryOptions,
  });

  // Query: Check user access
  const {
    data: hasAccess,
    isLoading: isLoadingAccess,
    error: accessError,
    refetch: refetchAccess,
  } = useQuery({
    queryKey: ['protocol', 'access', currentProtocolAddress, userAddress],
    queryFn: async () => {
      if (!protocol || !currentProtocolAddress || !userAddress) {
        throw new Error('Protocol client, address, or user address not available');
      }
      return protocol.checkUserAccess(currentProtocolAddress, userAddress);
    },
    enabled: enabled && !!protocol && !!currentProtocolAddress && !!userAddress,
    ...queryOptions,
  });

  // Mutation: Set requirements
  const setRequirementsMutation = useMutation({
    mutationFn: async (params: {
      minAge: number;
      jurisdictions: string[];
      requireAccredited: boolean;
    }) => {
      if (!protocol) {
        throw new Error('Protocol client not available');
      }
      return protocol.setRequirements(params);
    },
    onSuccess: () => {
      // Invalidate and refetch requirements
      queryClient.invalidateQueries({
        queryKey: ['protocol', 'requirements'],
      });
    },
  });

  // Mutation: Verify and grant access
  const verifyAndGrantAccessMutation = useMutation({
    mutationFn: async (params: {
      proof: {
        a: [string, string];
        b: [[string, string], [string, string]];
        c: [string, string];
      };
      publicSignals: string[];
      credentialHash: string;
      userAddress: string;
    }) => {
      if (!protocol || !currentProtocolAddress) {
        throw new Error('Protocol client or address not available');
      }
      return protocol.verifyUserAccess({
        userAddress: params.userAddress,
        proof: params.proof,
        publicSignals: params.publicSignals,
        credentialHash: params.credentialHash,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch access status
      queryClient.invalidateQueries({
        queryKey: ['protocol', 'access'],
      });
    },
  });

  return {
    protocol,
    requirements,
    isLoadingRequirements,
    requirementsError: requirementsError as Error | null,
    refetchRequirements: () => {
      refetchRequirements();
    },
    hasAccess,
    isLoadingAccess,
    accessError: accessError as Error | null,
    refetchAccess: () => {
      refetchAccess();
    },
    setRequirements: {
      mutate: setRequirementsMutation.mutate,
      mutateAsync: setRequirementsMutation.mutateAsync,
      isLoading: setRequirementsMutation.isPending,
      error: setRequirementsMutation.error as Error | null,
      reset: setRequirementsMutation.reset,
    },
    verifyAndGrantAccess: {
      mutate: verifyAndGrantAccessMutation.mutate,
      mutateAsync: verifyAndGrantAccessMutation.mutateAsync,
      isLoading: verifyAndGrantAccessMutation.isPending,
      error: verifyAndGrantAccessMutation.error as Error | null,
      reset: verifyAndGrantAccessMutation.reset,
    },
  };
}

