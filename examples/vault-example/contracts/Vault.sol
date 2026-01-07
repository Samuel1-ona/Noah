// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Note: In production, you would import from your deployed contracts
// For this example, we assume ProtocolAccessControl is deployed and passed in constructor
interface IProtocolAccessControl {
    function setRequirements(
        uint256 minAge,
        uint256[] memory allowedJurisdictions,
        bool requireAccredited
    ) external;
    
    function getRequirements(address protocol) external view returns (
        uint256 minAge,
        uint256[] memory allowedJurisdictions,
        bool requireAccredited
    );
    
    function checkAccess(address user) external view returns (bool);
    
    function verifyAndGrantAccess(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory publicSignals,
        bytes32 credentialHash,
        address user
    ) external;
}

/**
 * @title Vault
 * @notice A simple vault contract that demonstrates Noah integration
 * @dev Users must verify KYC credentials via ProtocolAccessControl before depositing
 */
contract Vault {
    // Events
    event Deposit(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdraw(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event RequirementsSet(
        uint256 minAge,
        uint256[] allowedJurisdictions,
        bool requireAccredited
    );
    
    // State variables
    IProtocolAccessControl public immutable protocolAccessControl;
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;
    
    /**
     * @notice Constructor
     * @param _protocolAccessControl Address of the ProtocolAccessControl contract
     */
    constructor(address _protocolAccessControl) {
        require(_protocolAccessControl != address(0), "Invalid protocol access control address");
        protocolAccessControl = IProtocolAccessControl(_protocolAccessControl);
    }
    
    /**
     * @notice Set KYC requirements for this vault
     * @param minAge Minimum age required
     * @param allowedJurisdictions Array of allowed jurisdiction hashes
     * @param requireAccredited Whether accredited investor status is required
     */
    function setRequirements(
        uint256 minAge,
        uint256[] memory allowedJurisdictions,
        bool requireAccredited
    ) external {
        protocolAccessControl.setRequirements(
            minAge,
            allowedJurisdictions,
            requireAccredited
        );
        
        emit RequirementsSet(minAge, allowedJurisdictions, requireAccredited);
    }
    
    /**
     * @notice Get current KYC requirements for this vault
     * @return minAge Minimum age required
     * @return allowedJurisdictions Array of allowed jurisdiction hashes
     * @return requireAccredited Whether accredited investor status is required
     */
    function getRequirements() external view returns (
        uint256 minAge,
        uint256[] memory allowedJurisdictions,
        bool requireAccredited
    ) {
        return protocolAccessControl.getRequirements(address(this));
    }
    
    /**
     * @notice Check if a user has access to this vault
     * @param user The user address to check
     * @return True if user has verified access
     */
    function hasAccess(address user) external view returns (bool) {
        return protocolAccessControl.checkAccess(user);
    }
    
    /**
     * @notice Verify proof and grant access to a user (called by the user)
     * @dev This function allows users to verify their proof and grant themselves access to this vault
     *      It calls ProtocolAccessControl.verifyAndGrantAccess with this vault's address as msg.sender
     * @param a Proof component a
     * @param b Proof component b
     * @param c Proof component c
     * @param publicSignals Public signals array (13 elements)
     * @param credentialHash The credential hash
     * @param user The user address (should be msg.sender)
     */
    function verifyAndGrantUserAccess(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory publicSignals,
        bytes32 credentialHash,
        address user
    ) external {
        // Call ProtocolAccessControl.verifyAndGrantAccess
        // Since we're calling it from this vault contract, msg.sender will be this vault's address
        // This ensures access is granted for this vault, not the user's address
        protocolAccessControl.verifyAndGrantAccess(
            a,
            b,
            c,
            publicSignals,
            credentialHash,
            user
        );
    }
    
    /**
     * @notice Deposit funds into the vault
     * @dev Requires user to have verified KYC credentials via ProtocolAccessControl
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        // Check if user has verified access
        bool access = protocolAccessControl.checkAccess(msg.sender);
        require(access, "User must verify KYC credentials before depositing");
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @notice Withdraw funds from the vault
     * @param amount The amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Check if user still has access (optional - you may want to allow withdrawals even if access is revoked)
        bool access = protocolAccessControl.checkAccess(msg.sender);
        require(access, "User access has been revoked");
        
        // Update state before external call (checks-effects-interactions pattern)
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        emit Withdraw(msg.sender, amount, block.timestamp);
        
        // Perform external call after state updates
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get user's balance in the vault
     * @param user The user address
     * @return The user's balance
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @notice Get total deposits in the vault
     * @return The total amount deposited
     */
    function getTotalDeposits() external view returns (uint256) {
        return totalDeposits;
    }
    
    /**
     * @notice Receive function to allow direct ETH transfers
     * @dev Still requires KYC verification
     */
    receive() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        bool access = protocolAccessControl.checkAccess(msg.sender);
        require(access, "User must verify KYC credentials before depositing");
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
}

