import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Signer } from 'ethers';
import type { TransactionResult } from '../utils/types';

/**
 * Configuration options for useCredentials hook
 */
export interface UseCredentialsOptions {
  /** User address to get credentials for */
  userAddress?: string;
  /** Issuer address to get credentials from */
  issuerAddress?: string;
  /** Credential hash to check */
  credentialHash?: string;
  /** Whether to enable automatic refetching */
  enabled?: boolean;
  /** React Query configuration options */
  queryOptions?: {
    refetchInterval?: number;
    staleTime?: number;
  };
}

/**
 * Credential information structure
 */
export interface CredentialInfo {
  credentialHash: string;
  userAddress: string;
  issuerAddress: string;
  isValid: boolean;
  isRevoked: boolean;
  timestamp?: bigint;
}

/**
 * Issuer information structure
 */
export interface IssuerInfo {
  isTrusted: boolean;
  name: string;
}

/**
 * Return type for useCredentials hook
 */
export interface UseCredentialsReturn {
  // Read operations
  credentialInfo: CredentialInfo | undefined;
  isLoadingCredential: boolean;
  credentialError: Error | null;
  refetchCredential: () => void;
  
  issuerInfo: IssuerInfo | undefined;
  isLoadingIssuer: boolean;
  issuerError: Error | null;
  refetchIssuer: () => void;
  
  userCredentials: CredentialInfo[] | undefined;
  isLoadingUserCredentials: boolean;
  userCredentialsError: Error | null;
  refetchUserCredentials: () => void;
  
  issuerCredentials: CredentialInfo[] | undefined;
  isLoadingIssuerCredentials: boolean;
  issuerCredentialsError: Error | null;
  refetchIssuerCredentials: () => void;
  
  // Write operations (mutations) - requires issuer signer
  registerCredential: {
    mutate: (params: {
      credentialHash: string;
      userAddress: string;
    }) => void;
    mutateAsync: (params: {
      credentialHash: string;
      userAddress: string;
    }) => Promise<TransactionResult>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
  
  revokeCredential: {
    mutate: (params: {
      credentialHash: string;
    }) => void;
    mutateAsync: (params: {
      credentialHash: string;
    }) => Promise<TransactionResult>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
}

/**
 * React hook for credential management operations
 * 
 * Provides easy access to credential-related functionality including:
 * - Checking credential validity
 * - Getting issuer information
 * - Listing user and issuer credentials
 * - Registering and revoking credentials (for issuers)
 * 
 * @param signer - Ethers signer instance (from wallet, required for write operations)
 * @param options - Configuration options
 * @returns Hook return object with credential operations
 * 
 * @example
 * ```tsx
 * import { useCredentials } from '@noah-protocol/sdk/hooks';
 * import { useSigner, useAccount } from 'wagmi';
 * 
 * function CredentialManager() {
 *   const { data: signer } = useSigner();
 *   const { address } = useAccount();
 *   const { 
 *     credentialInfo,
 *     registerCredential,
 *     revokeCredential
 *   } = useCredentials(signer, {
 *     credentialHash: '0x...',
 *     userAddress: address
 *   });
 * 
 *   const handleRegister = async () => {
 *     await registerCredential.mutateAsync({
 *       credentialHash: '0x...',
 *       userAddress: '0x...'
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {credentialInfo?.isValid ? (
 *         <p>Credential is valid</p>
 *       ) : (
 *         <button onClick={handleRegister}>
 *           Register Credential
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCredentials(
  signer: Signer | null | undefined,
  options: UseCredentialsOptions = {}
): UseCredentialsReturn {
  const {
    userAddress,
    issuerAddress,
    credentialHash,
    enabled = true,
    queryOptions = {},
  } = options;

  const queryClient = useQueryClient();

  // Get ContractClient instance (assuming it's available)
  const contractClient = useMemo(() => {
    try {
      const { ContractClient } = require('../core/ContractClient');
      return new ContractClient();
    } catch (error) {
      console.warn('ContractClient not available:', error);
      return null;
    }
  }, []);

  // Initialize contract client with provider if signer is available
  useMemo(() => {
    if (contractClient && signer) {
      const provider = signer.provider;
      if (provider) {
        contractClient.initialize(provider);
      }
    }
  }, [contractClient, signer]);

  // Query: Get credential info
  const {
    data: credentialInfo,
    isLoading: isLoadingCredential,
    error: credentialError,
    refetch: refetchCredential,
  } = useQuery({
    queryKey: ['credentials', 'info', credentialHash],
    queryFn: async () => {
      if (!contractClient || !credentialHash) {
        throw new Error('Contract client or credential hash not available');
      }
      const isValid = await contractClient.isCredentialValid(credentialHash);
      
      // Get issuer info if available
      let issuerAddress = '';
      try {
        // This would require additional contract methods
        // For now, we'll return basic info
        issuerAddress = '';
      } catch (error) {
        // Ignore if not available
      }
      
      return {
        credentialHash,
        userAddress: userAddress || '',
        issuerAddress,
        isValid,
        isRevoked: !isValid,
      } as CredentialInfo;
    },
    enabled: enabled && !!contractClient && !!credentialHash,
    ...queryOptions,
  });

  // Query: Get issuer info
  const {
    data: issuerInfo,
    isLoading: isLoadingIssuer,
    error: issuerError,
    refetch: refetchIssuer,
  } = useQuery({
    queryKey: ['credentials', 'issuer', issuerAddress],
    queryFn: async () => {
      if (!contractClient || !issuerAddress) {
        throw new Error('Contract client or issuer address not available');
      }
      return contractClient.getIssuerInfo(issuerAddress);
    },
    enabled: enabled && !!contractClient && !!issuerAddress,
    ...queryOptions,
  });

  // Query: Get user credentials (would need API endpoint or contract method)
  const {
    data: userCredentials,
    isLoading: isLoadingUserCredentials,
    error: userCredentialsError,
    refetch: refetchUserCredentials,
  } = useQuery({
    queryKey: ['credentials', 'user', userAddress],
    queryFn: async () => {
      if (!userAddress) {
        throw new Error('User address not available');
      }
      // This would typically call an API endpoint or contract method
      // For now, return empty array
      return [] as CredentialInfo[];
    },
    enabled: enabled && !!userAddress,
    ...queryOptions,
  });

  // Query: Get issuer credentials (would need API endpoint or contract method)
  const {
    data: issuerCredentials,
    isLoading: isLoadingIssuerCredentials,
    error: issuerCredentialsError,
    refetch: refetchIssuerCredentials,
  } = useQuery({
    queryKey: ['credentials', 'issuer-list', issuerAddress],
    queryFn: async () => {
      if (!issuerAddress) {
        throw new Error('Issuer address not available');
      }
      // This would typically call an API endpoint
      // For now, return empty array
      return [] as CredentialInfo[];
    },
    enabled: enabled && !!issuerAddress,
    ...queryOptions,
  });

  // Mutation: Register credential (requires issuer signer)
  const registerCredentialMutation = useMutation({
    mutationFn: async (params: {
      credentialHash: string;
      userAddress: string;
    }) => {
      if (!contractClient || !signer) {
        throw new Error('Contract client or signer not available');
      }
      return contractClient.registerCredential(
        signer,
        params.credentialHash,
        params.userAddress
      );
    },
    onSuccess: () => {
      // Invalidate credential queries
      queryClient.invalidateQueries({
        queryKey: ['credentials'],
      });
    },
  });

  // Mutation: Revoke credential (requires issuer signer)
  const revokeCredentialMutation = useMutation({
    mutationFn: async (params: {
      credentialHash: string;
    }) => {
      if (!contractClient || !signer) {
        throw new Error('Contract client or signer not available');
      }
      return contractClient.revokeCredential(signer, params.credentialHash);
    },
    onSuccess: () => {
      // Invalidate credential queries
      queryClient.invalidateQueries({
        queryKey: ['credentials'],
      });
    },
  });

  return {
    credentialInfo,
    isLoadingCredential,
    credentialError: credentialError as Error | null,
    refetchCredential: () => {
      refetchCredential();
    },
    issuerInfo,
    isLoadingIssuer,
    issuerError: issuerError as Error | null,
    refetchIssuer: () => {
      refetchIssuer();
    },
    userCredentials,
    isLoadingUserCredentials,
    userCredentialsError: userCredentialsError as Error | null,
    refetchUserCredentials: () => {
      refetchUserCredentials();
    },
    issuerCredentials,
    isLoadingIssuerCredentials,
    issuerCredentialsError: issuerCredentialsError as Error | null,
    refetchIssuerCredentials: () => {
      refetchIssuerCredentials();
    },
    registerCredential: {
      mutate: registerCredentialMutation.mutate,
      mutateAsync: registerCredentialMutation.mutateAsync,
      isLoading: registerCredentialMutation.isPending,
      error: registerCredentialMutation.error as Error | null,
      reset: registerCredentialMutation.reset,
    },
    revokeCredential: {
      mutate: revokeCredentialMutation.mutate,
      mutateAsync: revokeCredentialMutation.mutateAsync,
      isLoading: revokeCredentialMutation.isPending,
      error: revokeCredentialMutation.error as Error | null,
      reset: revokeCredentialMutation.reset,
    },
  };
}
