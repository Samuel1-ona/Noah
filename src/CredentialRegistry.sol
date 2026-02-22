// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CredentialRegistry
 * @notice Manages ZK-KYC credentials on-chain
 * @dev Stores credential hashes and manages trusted issuers and revocations
 */
contract CredentialRegistry is AccessControl {
    bytes32 public constant ISSUER_MANAGER_ROLE = keccak256("ISSUER_MANAGER_ROLE");

    // Events
    event CredentialIssued(
        address indexed user,
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event IssuerAdded(address indexed issuer, string name);
    event IssuerRemoved(address indexed issuer);
    
    event NullifierRegistered(bytes32 indexed nullifier, bytes32 indexed credentialHash, address indexed user);
    
    // State variables
    mapping(bytes32 => bool) public credentials; // credentialHash => exists
    mapping(bytes32 => address) public credentialIssuers; // credentialHash => issuer
    mapping(bytes32 => bool) public revokedCredentials; // credentialHash => revoked
    mapping(address => bool) public trustedIssuers; // issuer => isTrusted
    mapping(address => string) public issuerNames; // issuer => name
    
    mapping(bytes32 => address) public nullifierOwners; // nullifier => user address
    mapping(address => bytes32) public userToCredential; // user => latest credentialHash
    
    modifier onlyIssuer() {
        require(trustedIssuers[msg.sender], "Not trusted issuer");
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @notice Register a new credential hash
     * @param credentialHash The hash of the credential
     * @param user The address of the credential owner
     */
    function registerCredential(
        bytes32 credentialHash,
        address user
    ) external onlyIssuer {
        require(!credentials[credentialHash], "Credential already exists");
        require(!revokedCredentials[credentialHash], "Credential was revoked");
        
        credentials[credentialHash] = true;
        credentialIssuers[credentialHash] = msg.sender;
        userToCredential[user] = credentialHash;
        
        emit CredentialIssued(user, credentialHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Register a nullifier to prevent sybil attacks and bind identity to wallet
     * @param nullifier The unique nullifier for the identity
     * @param credentialHash The associated credential hash
     * @param user The address of the user presenting the identity
     */
    function registerNullifier(
        bytes32 nullifier,
        bytes32 credentialHash,
        address user
    ) external {
        // Only allow if the credential exists and is valid
        require(credentials[credentialHash], "Credential does not exist");
        require(!revokedCredentials[credentialHash], "Credential is revoked");
        
        if (nullifierOwners[nullifier] == address(0)) {
            // First time this identity is used: bind it to the wallet
            nullifierOwners[nullifier] = user;
        } else {
            // Reusable KYC check: must be the same owner
            require(nullifierOwners[nullifier] == user, "Identity bound to another wallet");
        }
        
        emit NullifierRegistered(nullifier, credentialHash, user);
    }
    
    /**
     * @notice Revoke a credential
     * @param credentialHash The hash of the credential to revoke
     */
    function revokeCredential(bytes32 credentialHash) external {
        require(
            credentials[credentialHash],
            "Credential does not exist"
        );
        require(
            credentialIssuers[credentialHash] == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to revoke"
        );
        
        revokedCredentials[credentialHash] = true;
        
        emit CredentialRevoked(credentialHash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Check if a credential is valid (exists and not revoked)
     * @param credentialHash The hash of the credential to check
     * @return isValid True if credential exists and is not revoked
     */
    function isCredentialValid(bytes32 credentialHash) external view returns (bool) {
        return credentials[credentialHash] && !revokedCredentials[credentialHash];
    }
    
    /**
     * @notice Add a trusted KYC issuer
     * @param issuer The address of the issuer
     * @param name The name of the issuer
     */
    function addIssuer(address issuer, string memory name) external onlyRole(ISSUER_MANAGER_ROLE) {
        require(!trustedIssuers[issuer], "Issuer already exists");
        trustedIssuers[issuer] = true;
        issuerNames[issuer] = name;
        
        emit IssuerAdded(issuer, name);
    }
    
    /**
     * @notice Remove a trusted KYC issuer
     * @param issuer The address of the issuer to remove
     */
    function removeIssuer(address issuer) external onlyRole(ISSUER_MANAGER_ROLE) {
        require(trustedIssuers[issuer], "Issuer does not exist");
        trustedIssuers[issuer] = false;
        
        emit IssuerRemoved(issuer);
    }
}
