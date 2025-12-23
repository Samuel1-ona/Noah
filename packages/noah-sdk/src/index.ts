/**
 * NOAH Protocol SDK
 * 
 * TypeScript/JavaScript SDK for integrating NOAH's privacy-preserving KYC functionality
 * into DeFi protocols and applications.
 */

// Core exports
export { ContractClient } from './core/ContractClient.js';
export { APIClient } from './core/APIClient.js';
export { WalletAdapter } from './core/WalletAdapter.js';
export type { WalletAdapterConfig, WalletState, WalletType } from './core/WalletAdapter.js';

// Protocol exports
export { ProtocolClient } from './protocol/ProtocolClient.js';
export { RequirementsManager } from './protocol/RequirementsManager.js';

// User exports
export { UserClient } from './user/UserClient.js';
export { ProofGenerator } from './user/ProofGenerator.js';
export type { Credential, ProofResult, UserClientConfig } from './user/UserClient.js';

// Issuer exports
export { IssuerClient } from './issuer/IssuerClient.js';

// Utilities
export {
  jurisdictionStringToHash,
  jurisdictionStringsToHashes,
  parseJurisdictions,
} from './utils/jurisdiction.js';

export {
  generateCredentialHash,
  isValidCredentialHash,
  isValidAddress,
  toChecksumAddress,
} from './utils/credentials.js';

// React hooks (optional)
export { useProtocol, useUser, useCredentials } from './hooks/index.js';
export type {
  UseProtocolOptions,
  UseProtocolReturn,
  UseUserOptions,
  UseUserReturn,
  UseCredentialsOptions,
  UseCredentialsReturn,
} from './hooks/index.js';

// Type exports
export type {
  ContractAddresses,
  Requirements,
  IssuerInfo,
  Proof,
  ZKProof,
  TransactionResult,
  ContractClientConfig,
  ProtocolClientConfig,
  SetRequirementsParams,
  VerifyUserAccessParams,
  CredentialIssuedEvent,
  AccessGrantedEvent,
  EventCallback,
  ContractEventPayload,
  CredentialData,
  CredentialHashResult,
} from './utils/types.js';

// API Client types
export type {
  APIClientConfig,
  ProofGenerationData,
  ProofGenerationResult,
  AccessStatus,
  CredentialStatus,
} from './core/APIClient.js';
