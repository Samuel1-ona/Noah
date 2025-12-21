// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredentialRegistry
 * @notice Manages ZK-KYC credentials on-chain
 * @dev Stores credential hashes and manages trusted issuers and revocations
 */
contract CredentialRegistry {
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
    
    // State variables
    mapping(bytes32 => bool) public credentials; // credentialHash => exists
    mapping(bytes32 => address) public credentialIssuers; // credentialHash => issuer
    mapping(bytes32 => bool) public revokedCredentials; // credentialHash => revoked
    mapping(address => bool) public trustedIssuers; // issuer => isTrusted
    mapping(address => string) public issuerNames; // issuer => name
    
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyIssuer() {
        require(trustedIssuers[msg.sender], "Not trusted issuer");
        _;
    }
    
    constructor() {
        owner = msg.sender;
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
        
        emit CredentialIssued(user, credentialHash, msg.sender, block.timestamp);
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
            credentialIssuers[credentialHash] == msg.sender || msg.sender == owner,
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
    function addIssuer(address issuer, string memory name) external onlyOwner {
        require(!trustedIssuers[issuer], "Issuer already exists");
        trustedIssuers[issuer] = true;
        issuerNames[issuer] = name;
        
        emit IssuerAdded(issuer, name);
    }
    
    /**
     * @notice Remove a trusted KYC issuer
     * @param issuer The address of the issuer to remove
     */
    function removeIssuer(address issuer) external onlyOwner {
        require(trustedIssuers[issuer], "Issuer does not exist");
        trustedIssuers[issuer] = false;
        
        emit IssuerRemoved(issuer);
    }
    
    /**
     * @notice Get issuer information
     * @param issuer The address of the issuer
     * @return isTrusted Whether the issuer is trusted
     * @return name The name of the issuer
     */
    function getIssuerInfo(address issuer) external view returns (bool isTrusted, string memory name) {
        return (trustedIssuers[issuer], issuerNames[issuer]);
    }
}

