import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants.js';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// #region agent log
// Only log in development to avoid errors in production
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.js:11',message:'Axios instance created',data:{baseURL:apiClient.defaults.baseURL,API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
}
// #endregion

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // #region agent log
    // Only log in development to avoid errors in production
    if (import.meta.env.DEV) {
      const fullUrl = `${config.baseURL}${config.url}`;
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.js:16',message:'API request being made',data:{baseURL:config.baseURL,url:config.url,fullUrl,method:config.method},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    // Add JWT token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // #region agent log
    // Only log in development to avoid errors in production
    if (import.meta.env.DEV) {
      const requestUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
      fetch('http://127.0.0.1:7243/ingest/5ad0b50e-7025-45eb-bffd-1e5073177618',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.js:32',message:'API request error',data:{requestUrl,status:error.response?.status,statusText:error.response?.statusText,errorMessage:error.response?.data?.error?.message||error.message,responseData:error.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    // Preserve full error object for detailed error handling
    // For 404 errors, we want to preserve the error response data
    const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';
    const enhancedError = new Error(errorMessage);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    // Preserve the full response data (including validation errors)
    if (error.response?.data) {
      enhancedError.responseData = error.response.data;
      // Also attach validation errors directly for easier access
      if (error.response.data.error?.validationErrors) {
        enhancedError.validationErrors = error.response.data.error.validationErrors;
      }
    }
    return Promise.reject(enhancedError);
  }
);

// Issuer Service Methods
export const issuerService = {
  /**
   * Register a credential hash on-chain
   * @param {string} credentialHash - The credential hash to register
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<Object>} Response with transaction hash
   */
  registerCredential: (credentialHash, userAddress) => {
    return apiClient.post(API_ENDPOINTS.registerCredential, {
      credentialHash,
      userAddress,
    });
  },

  /**
   * Revoke a credential
   * @param {string} credentialHash - The credential hash to revoke
   * @returns {Promise<Object>} Response with transaction hash
   */
  revokeCredential: (credentialHash) => {
    return apiClient.post(API_ENDPOINTS.revokeCredential, {
      credentialHash,
    });
  },

  /**
   * Check credential status
   * @param {string} credentialHash - The credential hash to check
   * @returns {Promise<Object>} Credential status information
   */
  checkCredential: (credentialHash) => {
    return apiClient.get(`${API_ENDPOINTS.checkCredential}/${credentialHash}`);
  },

  /**
   * Get all credentials issued by an issuer
   * @param {string} issuerAddress - The issuer's wallet address
   * @returns {Promise<Array>} List of credentials issued by the issuer
   */
  getIssuerCredentials: (issuerAddress) => {
    return apiClient.get(`${API_ENDPOINTS.getIssuerCredentials}/${issuerAddress}`);
  },
};

// User Service Methods
export const userService = {
  /**
   * Get protocol requirements
   * @param {string} protocolAddress - The protocol contract address
   * @returns {Promise<Object>} Protocol requirements
   */
  getProtocolRequirements: (protocolAddress) => {
    return apiClient.get(`${API_ENDPOINTS.getProtocolRequirements}/${protocolAddress}/requirements`);
  },

  /**
   * Check user access status
   * @param {string} protocolAddress - The protocol contract address
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<Object>} Access status information
   */
  checkAccess: (protocolAddress, userAddress) => {
    return apiClient.get(`${API_ENDPOINTS.checkAccess}/${protocolAddress}/${userAddress}`);
  },

  /**
   * Get credentials for a user address
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<Array>} List of credentials
   */
  getCredentials: (userAddress) => {
    return apiClient.get(`${API_ENDPOINTS.getCredentials}/${userAddress}`);
  },

  /**
   * Get credential data by hash
   * @param {string} credentialHash - The credential hash
   * @returns {Promise<Object>} Credential data
   */
  getCredentialByHash: (credentialHash) => {
    return apiClient.get(`${API_ENDPOINTS.getCredentialByHash}/${credentialHash}`);
  },
};

// Protocol Service Methods
export const protocolService = {
  /**
   * Set protocol requirements
   * @param {Object} requirements - Requirements object
   * @param {string} requirements.protocolAddress - Protocol contract address
   * @param {number} requirements.minAge - Minimum age required
   * @param {number[]} requirements.allowedJurisdictions - Array of allowed jurisdiction hashes
   * @param {boolean} requirements.requireAccredited - Whether accredited status is required
   * @param {string} requirements.privateKey - Private key for signing (should be handled securely)
   * @returns {Promise<Object>} Response with transaction hash
   */
  setRequirements: (requirements) => {
    return apiClient.post(API_ENDPOINTS.setRequirements, requirements);
  },

  /**
   * Get protocol requirements
   * @param {string} protocolAddress - The protocol contract address
   * @returns {Promise<Object>} Protocol requirements
   */
  getRequirements: (protocolAddress) => {
    return apiClient.get(`${API_ENDPOINTS.getRequirements}/${protocolAddress}`);
  },

  /**
   * Verify proof and grant access
   * @param {Object} verificationData - Verification data
   * @param {string} verificationData.protocolAddress - Protocol contract address
   * @param {string} verificationData.userAddress - User's wallet address
   * @param {string} verificationData.credentialHash - Credential hash
   * @param {Object} verificationData.proof - ZK proof object {a, b, c}
   * @param {string[]} verificationData.publicSignals - Public signals array
   * @returns {Promise<Object>} Response with transaction hash
   */
  verifyAccess: (verificationData) => {
    return apiClient.post(API_ENDPOINTS.verifyAccess, verificationData);
  },

  /**
   * Revoke user access
   * @param {string} protocolAddress - Protocol contract address
   * @param {string} userAddress - User's wallet address
   * @param {string} privateKey - Private key for signing
   * @returns {Promise<Object>} Response with transaction hash
   */
  revokeAccess: (protocolAddress, userAddress, privateKey) => {
    return apiClient.post(API_ENDPOINTS.revokeAccess, {
      protocolAddress,
      userAddress,
      privateKey,
    });
  },
};

// Proof Service Methods
export const proofService = {
  /**
   * Generate ZK proof
   * @param {Object} proofData - Proof generation data
   * @param {Object} proofData.credential - Credential object
   * @param {Object} proofData.requirements - Requirements object
   * @returns {Promise<Object>} Generated proof and public signals
   */
  generateProof: (proofData) => {
    return apiClient.post(API_ENDPOINTS.generateProof, proofData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || 'test-token'}`,
      },
    });
  },

  /**
   * Get proofs for a credential
   * @param {string} credentialHash - The credential hash
   * @returns {Promise<Object>} List of proofs
   */
  getProofs: (credentialHash) => {
    return apiClient.get(`${API_ENDPOINTS.getProofs}/${credentialHash}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || 'test-token'}`,
      },
    });
  },
};

// Health Check
export const healthCheck = () => {
  return apiClient.get(API_ENDPOINTS.health);
};

// Export default apiClient for custom requests
export default apiClient;

