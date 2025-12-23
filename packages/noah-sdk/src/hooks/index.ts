/**
 * React hooks for NOAH SDK
 * 
 * These hooks provide React integration for the NOAH SDK, making it easy
 * to use NOAH functionality in React applications.
 * 
 * @example
 * ```tsx
 * import { useProtocol, useUser, useCredentials } from '@noah-protocol/sdk/hooks';
 * ```
 */

export { useProtocol } from './useProtocol';
export type { UseProtocolOptions, UseProtocolReturn } from './useProtocol';

export { useUser } from './useUser';
export type { UseUserOptions, UseUserReturn, Credential } from './useUser';

export { useCredentials } from './useCredentials';
export type {
  UseCredentialsOptions,
  UseCredentialsReturn,
  CredentialInfo,
  IssuerInfo,
} from './useCredentials';


