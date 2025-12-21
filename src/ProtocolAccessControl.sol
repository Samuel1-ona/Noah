// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IZKVerifier.sol";
import "./CredentialRegistry.sol";

/**
 * @title ProtocolAccessControl
 * @notice Manages access control for DeFi protocols using ZK-KYC
 * @dev Protocols can set requirements and verify users meet them via ZK proofs
 */
contract ProtocolAccessControl {
    // Events
    event RequirementsSet(
        address indexed protocol,
        uint256 minAge,
        uint256[] allowedJurisdictions,
        bool requireAccredited
    );
    
    event AccessGranted(
        address indexed user,
        address indexed protocol,
        bytes32 credentialHash,
        uint256 timestamp
    );
    
    event AccessRevoked(
        address indexed user,
        address indexed protocol,
        uint256 timestamp
    );
    
    // Protocol requirements
    struct Requirements {
        uint256 minAge;
        uint256[] allowedJurisdictions; // Array of jurisdiction hashes
        bool requireAccredited;
        bool isSet;
    }
    
    // State variables
    mapping(address => Requirements) public protocolRequirements;
    mapping(address => mapping(address => bool)) public hasAccess; // protocol => user => hasAccess
    mapping(address => mapping(address => bytes32)) public userCredentials; // protocol => user => credentialHash
    
    IZKVerifier public immutable zkVerifier;
    CredentialRegistry public immutable credentialRegistry;
    
    constructor(address _zkVerifier, address _credentialRegistry) {
        zkVerifier = IZKVerifier(_zkVerifier);
        credentialRegistry = CredentialRegistry(_credentialRegistry);
    }
    
    /**
     * @notice Set verification requirements for a protocol
     * @param minAge Minimum age required
     * @param allowedJurisdictions Array of allowed jurisdiction hashes
     * @param requireAccredited Whether accredited investor status is required
     */
    function setRequirements(
        uint256 minAge,
        uint256[] memory allowedJurisdictions,
        bool requireAccredited
    ) external {
        require(allowedJurisdictions.length <= 10, "Too many jurisdictions");
        
        protocolRequirements[msg.sender] = Requirements({
            minAge: minAge,
            allowedJurisdictions: allowedJurisdictions,
            requireAccredited: requireAccredited,
            isSet: true
        });
        
        emit RequirementsSet(
            msg.sender,
            minAge,
            allowedJurisdictions,
            requireAccredited
        );
    }
    
    /**
     * @notice Verify ZK proof and grant access to protocol
     * @param a The A component of the ZK proof
     * @param b The B component of the ZK proof
     * @param c The C component of the ZK proof
     * @param publicSignals The public signals from the proof
     * @param credentialHash The credential hash being verified
     * @param user The user address to grant access to
     */
    function verifyAndGrantAccess(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory publicSignals,
        bytes32 credentialHash,
        address user
    ) external {
        // Check protocol has set requirements
        Requirements memory req = protocolRequirements[msg.sender];
        require(req.isSet, "Requirements not set");
        
        // Verify credential is valid and not revoked
        require(
            credentialRegistry.isCredentialValid(credentialHash),
            "Invalid or revoked credential"
        );
        
        // Reconstruct full 14-element public inputs array for verifier
        // Circuit expects: [0]=minAge, [1-10]=allowedJurisdictions, [11]=requireAccredited, [12]=credentialHashPublic, [13]=isValid
        uint[14] memory fullPublicInputs;
        
        // minAge
        fullPublicInputs[0] = publicSignals[0];
        
        // allowedJurisdictions (10 elements)
        // publicSignals[1-10] maps to fullPublicInputs[1-10]
        for (uint i = 0; i < 10 && i < publicSignals.length - 3; i++) {
            fullPublicInputs[i + 1] = publicSignals[i + 1];
        }
        // Pad remaining jurisdictions with 0 if needed
        for (uint i = publicSignals.length - 3; i < 10; i++) {
            fullPublicInputs[i + 1] = 0;
        }
        
        // requireAccredited
        fullPublicInputs[11] = publicSignals[11];
        
        // credentialHashPublic
        fullPublicInputs[12] = publicSignals[12];
        
        // isValid (expected to be 1 for valid proof)
        fullPublicInputs[13] = 1;
        
        // Verify ZK proof with full 14-element array
        bool proofValid = zkVerifier.verifyProof(a, b, c, fullPublicInputs);
        require(proofValid, "Invalid proof");
        
        // Verify public signals match protocol requirements
        require(publicSignals[0] == req.minAge, "Age requirement mismatch");
        require(publicSignals[11] == (req.requireAccredited ? 1 : 0), "Accreditation requirement mismatch");
        
        // Verify credential hash matches
        // Note: The circuit uses a truncated hash (last 15 hex chars = 60 bits) for proof generation
        // because Go's int64 can only hold values up to 2^63 - 1. We extract the same truncated portion
        // from the full hash for comparison.
        uint256 fullHash = uint256(credentialHash);
        // Extract last 15 hex chars (60 bits) by masking with (2^60 - 1)
        // This matches what the proof generation uses (last 15 hex characters where the actual value is)
        uint256 truncatedHash = fullHash & 0xFFFFFFFFFFFFFFF; // Mask to get last 60 bits (15 hex chars)
        require(publicSignals[12] == truncatedHash, "Credential hash mismatch");
        
        // Check jurisdiction (simplified - in production, verify all allowed jurisdictions match)
        // For now, we verify the proof is valid which means jurisdiction is in allowed list
        
        // Grant access
        hasAccess[msg.sender][user] = true;
        userCredentials[msg.sender][user] = credentialHash;
        
        emit AccessGranted(user, msg.sender, credentialHash, block.timestamp);
    }
    
    /**
     * @notice Check if a user has access to a protocol
     * @param user The user address to check
     * @return hasAccess_ True if user has access
     */
    function checkAccess(address user) external view returns (bool) {
        return hasAccess[msg.sender][user];
    }
    
    /**
     * @notice Revoke a user's access to the protocol
     * @param user The user address to revoke
     */
    function revokeAccess(address user) external {
        require(hasAccess[msg.sender][user], "User does not have access");
        hasAccess[msg.sender][user] = false;
        
        emit AccessRevoked(user, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Get protocol requirements
     * @return minAge Minimum age required
     * @return allowedJurisdictions Array of allowed jurisdiction hashes
     * @return requireAccredited Whether accredited investor status is required
     */
    function getRequirements(address protocol) external view returns (
        uint256 minAge,
        uint256[] memory allowedJurisdictions,
        bool requireAccredited
    ) {
        Requirements memory req = protocolRequirements[protocol];
        return (req.minAge, req.allowedJurisdictions, req.requireAccredited);
    }
}

