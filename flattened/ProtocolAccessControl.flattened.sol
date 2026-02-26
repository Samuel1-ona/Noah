// SPDX-License-Identifier: MIT
pragma solidity >=0.4.16 >=0.8.4 ^0.8.20;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// lib/openzeppelin-contracts/contracts/access/IAccessControl.sol

// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

// lib/openzeppelin-contracts/contracts/utils/introspection/IERC165.sol

// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// src/IZKVerifier.sol

/**
 * @title IZKVerifier
 * @notice Interface for ZK proof verification
 * @dev This interface will be implemented by the generated verifier contract
 */
interface IZKVerifier {
    /**
     * @notice Verify a ZK proof
     * @param a The A component of the ZK proof (G1 point)
     * @param b The B component of the ZK proof (G2 point)
     * @param c The C component of the ZK proof (G1 point)
     * @param publicSignals The public signals array (28 elements)
     * @dev Public signals order: 
     *      [0]=minAge, [1-10]=allowedJurisdictions, [11]=requireAccredited, 
     *      [12]=credentialHashPublic, [13]=appID, [14]=currentDate, [15-24]=sanctionedCountries,
     *      [25]=isValid, [26]=nullifier, [27]=packedFlags
     * @return isValid True if the proof is valid
     */
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[28] memory publicSignals
    ) external view returns (bool isValid);
}

// lib/openzeppelin-contracts/contracts/utils/introspection/ERC165.sol

// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// lib/openzeppelin-contracts/contracts/access/AccessControl.sol

// OpenZeppelin Contracts (last updated v5.4.0) (access/AccessControl.sol)

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}

// src/CredentialRegistry.sol

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

// src/ProtocolAccessControl.sol

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

