import type { 
  Provider, 
  ContractTransactionReceipt,
  EventLog,
  Log
} from 'ethers';

/**
 * Contract addresses configuration
 */
export interface ContractAddresses {
  CredentialRegistry: string;
  ZKVerifier: string;
  ProtocolAccessControl: string;
}

/**
 * Protocol requirements structure
 */
export interface Requirements {
  minAge: number;
  allowedJurisdictions: string[];
  requireAccredited: boolean;
  isSet?: boolean;
}

/**
 * Issuer information structure
 */
export interface IssuerInfo {
  isTrusted: boolean;
  name: string;
}

/**
 * ZK Proof structure (Groth16 format)
 */
export interface Proof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
}

/**
 * ZK Proof structure (alias for compatibility)
 */
export type ZKProof = Proof;

/**
 * Transaction result
 */
export interface TransactionResult {
  transactionHash: string;
  receipt: ContractTransactionReceipt | null;
}

/**
 * Contract client configuration options
 */
export interface ContractClientConfig {
  provider?: Provider;
  contractAddresses?: ContractAddresses;
  rpcUrl?: string;
}

/**
 * Protocol client configuration
 */
export interface ProtocolClientConfig {
  protocolAccessControlAddress?: string;
  provider?: Provider;
}

/**
 * Set requirements parameters
 */
export interface SetRequirementsParams {
  minAge: number;
  jurisdictions: string[] | number[];
  requireAccredited: boolean;
}

/**
 * Verify user access parameters
 */
export interface VerifyUserAccessParams {
  userAddress: string;
  proof: Proof;
  publicSignals: string[] | number[];
  credentialHash: string;
}

/**
 * Credential issued event payload
 */
export interface CredentialIssuedEvent {
  user: string;
  credentialHash: string;
  issuer: string;
  timestamp: bigint;
}

/**
 * Access granted event payload
 */
export interface AccessGrantedEvent {
  user: string;
  protocol: string;
  credentialHash: string;
  timestamp: bigint;
}

/**
 * Contract event listener callback type
 */
export type EventCallback<T = any> = (
  ...args: T[]
) => void | Promise<void>;

/**
 * Contract event payload type
 */
export type ContractEventPayload = EventLog | Log;

/**
 * Credential data structure for hash generation
 */
export interface CredentialData {
  userAddress: string;
  age: number;
  jurisdiction: string;
  accredited: boolean;
  timestamp?: number;
}

/**
 * Credential hash generation result
 */
export interface CredentialHashResult {
  credentialHash: string;
  jurisdictionHash: string;
  credentialData: string;
  timestamp: number;
}
