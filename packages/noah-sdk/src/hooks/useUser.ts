import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import type { Signer } from 'ethers';
import { UserClient, type Credential as UserCredential } from '../user/UserClient';
import type { Requirements, TransactionResult, ZKProof } from '../utils/types';

/**
 * Configuration options for useUser hook
 */
export interface UseUserOptions {
  /** User's wallet address */
  userAddress?: string;
  /** Protocol address to check requirements/access for */
  protocolAddress?: string;
  /** Credential hash to check validity for */
  credentialHash?: string;
  /** API base URL for proof generation */
  apiBaseUrl?: string;
  /** Whether to enable automatic refetching */
  enabled?: boolean;
  /** React Query configuration options */
  queryOptions?: {
    refetchInterval?: number;
    staleTime?: number;
  };
}

/**
 * Credential structure (re-exported from UserClient for convenience)
 */
export type Credential = UserCredential;

/**
 * Return type for useUser hook
 */
export interface UseUserReturn {
  // User client instance
  user: UserClient | null;
  
  // Read operations
  protocolRequirements: Requirements | undefined;
  isLoadingRequirements: boolean;
  requirementsError: Error | null;
  refetchRequirements: () => void;
  
  // Credential validation
  isCredentialValid: boolean | undefined;
  isLoadingCredential: boolean;
  credentialError: Error | null;
  refetchCredential: () => void;
  
  // Write operations (mutations)
  checkCredentialValidity: {
    mutate: (credentialHash: string) => void;
    mutateAsync: (credentialHash: string) => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
  
  generateProof: {
    mutate: (params: {
      credential: Credential;
      requirements: Requirements & { protocolAddress: string };
    }) => void;
    mutateAsync: (params: {
      credential: Credential;
      requirements: Requirements & { protocolAddress: string };
    }) => Promise<{
      proof: ZKProof;
      publicSignals: string[];
      credentialHash: string;
      success: boolean;
    }>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
  
  verifyAndGrantAccess: {
    mutate: (params: {
      proof: ZKProof;
      publicSignals: string[];
      credentialHash: string;
      protocolAddress: string;
    }) => void;
    mutateAsync: (params: {
      proof: ZKProof;
      publicSignals: string[];
      credentialHash: string;
      protocolAddress: string;
    }) => Promise<TransactionResult>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
}

/**
 * React hook for user operations
 * 
 * Provides easy access to user-related functionality including:
 * - Getting protocol requirements
 * - Checking credential validity
 * - Generating ZK proofs
 * - Verifying proofs and granting access to protocols
 * 
 * @param signer - Ethers signer instance (from wallet)
 * @param options - Configuration options
 * @returns Hook return object with user operations
 * 
 * @example
 * ```tsx
 * import { useUser } from '@noah-protocol/sdk/hooks';
 * import { useSigner, useAccount } from 'wagmi';
 * 
 * function UserDashboard() {
 *   const { data: signer } = useSigner();
 *   const { address } = useAccount();
 *   const { 
 *     protocolRequirements,
 *     generateProof,
 *     verifyAndGrantAccess,
 *     hasAccess
 *   } = useUser(signer, {
 *     userAddress: address,
 *     protocolAddress: '0x...',
 *     apiBaseUrl: 'https://api.noah.xyz'
 *   });
 * 
 *   const handleGenerateProof = async () => {
 *     const result = await generateProof.mutateAsync({
 *       credential: {
 *         actualAge: 25,
 *         actualJurisdiction: 'US',
 *         actualAccredited: true,
 *         credentialHash: '0x...'
 *       },
 *       requirements: protocolRequirements!
 *     });
 *     
 *     await verifyAndGrantAccess.mutateAsync({
 *       ...result,
 *       credentialHash: '0x...',
 *       protocolAddress: '0x...'
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {hasAccess ? (
 *         <p>You have access!</p>
 *       ) : (
 *         <button onClick={handleGenerateProof}>
 *           Request Access
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUser(
  signer: Signer | null | undefined,
  options: UseUserOptions = {}
): UseUserReturn {
  const {
    userAddress,
    protocolAddress,
    credentialHash,
    apiBaseUrl,
    enabled = true,
    queryOptions = {},
  } = options;

  const queryClient = useQueryClient();

  // Create user client instance
  const user = useMemo(() => {
    if (!signer) return null;
    try {
      return new UserClient(signer, { apiBaseUrl });
    } catch (error) {
      console.warn('UserClient not available:', error);
      return null;
    }
  }, [signer, apiBaseUrl]);

  // Note: userAddress is used directly in queries below

  // Query: Get protocol requirements
  const {
    data: protocolRequirements,
    isLoading: isLoadingRequirements,
    error: requirementsError,
    refetch: refetchRequirements,
  } = useQuery({
    queryKey: ['user', 'protocol-requirements', protocolAddress],
    queryFn: async () => {
      if (!user || !protocolAddress) {
        throw new Error('User client or protocol address not available');
      }
      return user.getProtocolRequirements(protocolAddress);
    },
    enabled: enabled && !!user && !!protocolAddress,
    ...queryOptions,
  });

  // Note: To check user access, use the useProtocol hook instead
  // This is because access checking is a protocol-level operation

  // Query: Check credential validity
  const {
    data: isCredentialValid,
    isLoading: isLoadingCredential,
    error: credentialError,
    refetch: refetchCredential,
  } = useQuery({
    queryKey: ['user', 'credential-validity', credentialHash],
    queryFn: async () => {
      if (!user || !credentialHash) {
        throw new Error('User client or credential hash not available');
      }
      return user.checkCredentialValidity(credentialHash);
    },
    enabled: enabled && !!user && !!credentialHash,
    ...queryOptions,
  });

  // Mutation: Check credential validity
  const checkCredentialValidityMutation = useMutation({
    mutationFn: async (credentialHash: string) => {
      if (!user) {
        throw new Error('User client not available');
      }
      return user.checkCredentialValidity(credentialHash);
    },
  });

  // Mutation: Generate proof
  const generateProofMutation = useMutation({
    mutationFn: async (params: {
      credential: Credential;
      requirements: Requirements & { protocolAddress: string };
    }) => {
      if (!user) {
        throw new Error('User client not available');
      }
      return user.generateProof(params.credential, params.requirements);
    },
  });

  // Mutation: Verify and grant access
  const verifyAndGrantAccessMutation = useMutation({
    mutationFn: async (params: {
      proof: ZKProof;
      publicSignals: string[];
      credentialHash: string;
      protocolAddress?: string;
      userAddress?: string;
    }) => {
      if (!user) {
        throw new Error('User client not available');
      }
      // UserClient.verifyAndGrantAccess expects a ProofResult object
      return user.verifyAndGrantAccess(
        {
          proof: params.proof,
          publicSignals: params.publicSignals,
          credentialHash: params.credentialHash,
          success: true,
        },
        params.protocolAddress,
        params.userAddress
      );
    },
    onSuccess: () => {
      // Invalidate and refetch access status
      queryClient.invalidateQueries({
        queryKey: ['user', 'access'],
      });
    },
  });

  return {
    user,
    protocolRequirements,
    isLoadingRequirements,
    requirementsError: requirementsError as Error | null,
    refetchRequirements: () => {
      refetchRequirements();
    },
    isCredentialValid,
    isLoadingCredential,
    credentialError: credentialError as Error | null,
    refetchCredential: () => {
      refetchCredential();
    },
    checkCredentialValidity: {
      mutate: checkCredentialValidityMutation.mutate,
      mutateAsync: checkCredentialValidityMutation.mutateAsync,
      isLoading: checkCredentialValidityMutation.isPending,
      error: checkCredentialValidityMutation.error as Error | null,
      reset: checkCredentialValidityMutation.reset,
    },
    generateProof: {
      mutate: generateProofMutation.mutate,
      mutateAsync: generateProofMutation.mutateAsync,
      isLoading: generateProofMutation.isPending,
      error: generateProofMutation.error as Error | null,
      reset: generateProofMutation.reset,
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

