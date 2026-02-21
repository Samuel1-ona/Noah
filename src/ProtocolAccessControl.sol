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
    // Public Signal Indices (Constants for Gas Optimization)
    uint256 private constant INDEX_MIN_AGE = 0;
    uint256 private constant INDEX_JURISDICTION_START = 1;
    uint256 private constant INDEX_ACCREDITED = 11;
    uint256 private constant INDEX_CREDENTIAL_HASH = 12;
    uint256 private constant INDEX_USER_ADDRESS = 13;
    uint256 private constant INDEX_CURRENT_DATE = 14;
    uint256 private constant INDEX_IS_VALID = 25;
    uint256 private constant INDEX_NULLIFIER = 26;
    uint256 private constant INDEX_PACKED_FLAGS = 27;

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
        bytes32 indexed credentialHash,
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
        uint[28] memory publicSignals,
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
        
        // Verify ZK proof
        bool proofValid = zkVerifier.verifyProof(a, b, c, publicSignals);
        require(proofValid, "Invalid proof");
        require(publicSignals[INDEX_IS_VALID] == 1, "Circuit isValid output must be 1");
        
        // 1. Verify MinAge requirement matches
        require(publicSignals[INDEX_MIN_AGE] == req.minAge, "Age requirement mismatch");
        
        // 2. Verify Jurisdictions match
        for (uint i = 0; i < 10; i++) {
            uint256 proofJurisdiction = publicSignals[INDEX_JURISDICTION_START + i];
            if (i < req.allowedJurisdictions.length) {
                require(proofJurisdiction == req.allowedJurisdictions[i], "Jurisdiction requirement mismatch");
            } else {
                require(proofJurisdiction == 0, "Jurisdiction requirement mismatch");
            }
        }

        // 3. Verify Accreditation requirement matches
        uint256 reqAccredited = req.requireAccredited ? 1 : 0;
        require(publicSignals[INDEX_ACCREDITED] == reqAccredited, "Accreditation requirement mismatch");

        // 4. Verify Proof is bound to the User Wallet (recipientAddress)
        require(publicSignals[INDEX_USER_ADDRESS] == uint256(uint160(user)), "Proof not bound to this user");

        // 5. Verify Credential Hash matches (truncated 60-bit hash)
        uint256 truncatedHash = uint256(credentialHash) & 0xFFFFFFFFFFFFFFF;
        require(publicSignals[INDEX_CREDENTIAL_HASH] == truncatedHash, "Credential hash mismatch");

        // 6. Verify Packed Flags (isOver18, isOver21, validExpiry, isNotSanctioned)
        uint256 packedFlags = publicSignals[INDEX_PACKED_FLAGS];
        // bit 0: isOver18, bit 1: isOver21, bit 2: validExpiry, bit 3: isNotSanctioned
        require((packedFlags & 0x4) != 0, "Passport expired");
        require((packedFlags & 0x8) != 0, "Nationality sanctioned");
        
        if (req.minAge >= 21) {
            require((packedFlags & 0x2) != 0, "Not over 21");
        } else if (req.minAge >= 18) {
            require((packedFlags & 0x1) != 0, "Not over 18");
        }

        // 7. Verify CurrentDate is recent (within 1 hour)
        require(publicSignals[INDEX_CURRENT_DATE] <= block.timestamp, "Proof date in future");
        require(publicSignals[INDEX_CURRENT_DATE] >= block.timestamp - 1 hours, "Proof too old");

        // Register Nullifier to prevent Sybil attacks and document reuse by others
        bytes32 nullifier = bytes32(publicSignals[INDEX_NULLIFIER]);
        credentialRegistry.registerNullifier(nullifier, credentialHash, user);
        
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
}
