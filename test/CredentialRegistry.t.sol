// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CredentialRegistry} from "../src/CredentialRegistry.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract CredentialRegistryTest is Test {
    CredentialRegistry public registry;
    
    address public owner;
    address public issuer;
    address public user;
    bytes32 public credentialHash;
    
    function setUp() public {
        owner = address(this);
        issuer = address(0x1);
        user = address(0x2);
        credentialHash = keccak256("test-credential");
        
        registry = new CredentialRegistry();
        
        // Add issuer
        registry.addIssuer(issuer, "Test KYC Provider");
    }
    
    function test_AddIssuer() public {
        address newIssuer = address(0x3);
        registry.addIssuer(newIssuer, "New Provider");
        
        bool isTrusted = registry.trustedIssuers(newIssuer);
        string memory name = registry.issuerNames(newIssuer);
        assertTrue(isTrusted);
        assertEq(name, "New Provider");
    }
    
    function test_RegisterCredential() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        assertTrue(registry.credentials(credentialHash));
        assertEq(registry.credentialIssuers(credentialHash), issuer);
    }
    
    function test_RegisterCredential_OnlyIssuer() public {
        vm.expectRevert("Not trusted issuer");
        registry.registerCredential(credentialHash, user);
    }
    
    function test_RevokeCredential() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        vm.prank(issuer);
        registry.revokeCredential(credentialHash);
        
        assertTrue(registry.revokedCredentials(credentialHash));
        assertFalse(registry.isCredentialValid(credentialHash));
    }
    
    function test_IsCredentialValid() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        assertTrue(registry.isCredentialValid(credentialHash));
        
        vm.prank(issuer);
        registry.revokeCredential(credentialHash);
        
        assertFalse(registry.isCredentialValid(credentialHash));
    }
    
    function test_RemoveIssuer() public {
        registry.removeIssuer(issuer);
        
        bool isTrusted = registry.trustedIssuers(issuer);
        assertFalse(isTrusted);
    }
    
    // ============ EDGE CASE TESTS ============
    
    function test_RegisterCredential_Duplicate() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        vm.prank(issuer);
        vm.expectRevert("Credential already exists");
        registry.registerCredential(credentialHash, user);
    }
    
    function test_RegisterCredential_RevokedCredential() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        vm.prank(issuer);
        registry.revokeCredential(credentialHash);
        
        bytes32 newHash = keccak256("new-credential");
        vm.prank(issuer);
        // Should be able to register a new credential with different hash
        registry.registerCredential(newHash, user);
        
        // Cannot register the revoked one again - checks "already exists" first
        // Note: Contract checks existence before revocation status
        vm.prank(issuer);
        vm.expectRevert("Credential already exists");
        registry.registerCredential(credentialHash, user);
    }
    
    function test_RegisterCredential_RevokedCredentialCheck() public {
        // Test that revoked credentials cannot be registered if they don't exist yet
        // This edge case: trying to register a hash that was never registered but is marked as revoked
        // In practice, this shouldn't happen, but tests the revocation check
        bytes32 newHash = keccak256("never-registered");
        
        // Directly set revoked (simulating edge case - in practice this can't happen)
        // Since we can't directly set revoked, we'll test the normal flow:
        // Register -> Revoke -> Try to register again (already tested above)
        // This test verifies the revocation check works in the normal flow
        vm.prank(issuer);
        registry.registerCredential(newHash, user);
        
        assertTrue(registry.isCredentialValid(newHash));
        
        vm.prank(issuer);
        registry.revokeCredential(newHash);
        
        assertFalse(registry.isCredentialValid(newHash));
    }
    
    function test_RevokeCredential_NonExistent() public {
        bytes32 nonExistentHash = keccak256("non-existent");
        
        vm.prank(issuer);
        vm.expectRevert("Credential does not exist");
        registry.revokeCredential(nonExistentHash);
    }
    
    function test_RevokeCredential_Unauthorized() public {
        address otherIssuer = address(0x4);
        registry.addIssuer(otherIssuer, "Other Issuer");
        
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        // Other issuer cannot revoke
        vm.prank(otherIssuer);
        vm.expectRevert("Not authorized to revoke");
        registry.revokeCredential(credentialHash);
    }
    
    function test_RevokeCredential_OwnerCanRevoke() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        // Owner can revoke any credential
        registry.revokeCredential(credentialHash);
        
        assertTrue(registry.revokedCredentials(credentialHash));
    }
    
    function test_AddIssuer_Duplicate() public {
        vm.expectRevert("Issuer already exists");
        registry.addIssuer(issuer, "Duplicate");
    }
    
    function test_AddIssuer_ZeroAddress() public {
        // Note: Contract currently allows zero address - this documents the behavior
        // In production, you may want to add a zero address check
        registry.addIssuer(address(0), "Zero Address");
        
        bool isTrusted = registry.trustedIssuers(address(0));
        string memory name = registry.issuerNames(address(0));
        assertTrue(isTrusted);
        assertEq(name, "Zero Address");
    }
    
    function test_RemoveIssuer_NonExistent() public {
        address nonExistent = address(0x5);
        
        vm.expectRevert("Issuer does not exist");
        registry.removeIssuer(nonExistent);
    }
    
    function test_RemoveIssuer_ThenReAdd() public {
        registry.removeIssuer(issuer);
        
        // Can re-add after removal
        registry.addIssuer(issuer, "Re-added Issuer");
        
        bool isTrusted = registry.trustedIssuers(issuer);
        string memory name = registry.issuerNames(issuer);
        assertTrue(isTrusted);
        assertEq(name, "Re-added Issuer");
    }
    
    function test_RegisterCredential_AfterIssuerRemoved() public {
        registry.removeIssuer(issuer);
        
        vm.prank(issuer);
        vm.expectRevert("Not trusted issuer");
        registry.registerCredential(credentialHash, user);
    }
    
    function test_IsCredentialValid_NonExistent() public {
        bytes32 nonExistentHash = keccak256("non-existent");
        assertFalse(registry.isCredentialValid(nonExistentHash));
    }
    
    function test_IsCredentialValid_Revoked() public {
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        assertTrue(registry.isCredentialValid(credentialHash));
        
        vm.prank(issuer);
        registry.revokeCredential(credentialHash);
        
        assertFalse(registry.isCredentialValid(credentialHash));
    }
    
    function test_GetIssuerInfo_NonExistent() public {
        address nonExistent = address(0x6);
        
        bool isTrusted = registry.trustedIssuers(nonExistent);
        string memory name = registry.issuerNames(nonExistent);
        assertFalse(isTrusted);
        assertEq(name, "");
    }
    
    function test_AddIssuer_EmptyName() public {
        address newIssuer = address(0x7);
        registry.addIssuer(newIssuer, "");
        
        bool isTrusted = registry.trustedIssuers(newIssuer);
        string memory name = registry.issuerNames(newIssuer);
        assertTrue(isTrusted);
        assertEq(name, "");
    }
    
    function test_RegisterCredential_ZeroAddressUser() public {
        bytes32 newHash = keccak256("zero-user-credential");
        
        vm.prank(issuer);
        // Should allow zero address as user (edge case)
        registry.registerCredential(newHash, address(0));
        
        assertTrue(registry.credentials(newHash));
    }
    
    function test_RegisterCredential_MultipleUsersSameHash() public {
        address user2 = address(0x8);
        
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
        
        // Cannot register same hash for different user
        vm.prank(issuer);
        vm.expectRevert("Credential already exists");
        registry.registerCredential(credentialHash, user2);
    }
    
    function test_Owner_OnlyOperations() public {
        address nonOwner = address(0x9);
        bytes32 issuerManagerRole = registry.ISSUER_MANAGER_ROLE();
        
        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                nonOwner,
                issuerManagerRole
            )
        );
        registry.addIssuer(address(0xA), "Test");
        
        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                nonOwner,
                issuerManagerRole
            )
        );
        registry.removeIssuer(issuer);
    }
    
    function test_CredentialIssuer_Mapping() public {
        address issuer2 = address(0xB);
        registry.addIssuer(issuer2, "Issuer 2");
        
        bytes32 hash1 = keccak256("hash1");
        bytes32 hash2 = keccak256("hash2");
        
        vm.prank(issuer);
        registry.registerCredential(hash1, user);
        
        vm.prank(issuer2);
        registry.registerCredential(hash2, user);
        
        assertEq(registry.credentialIssuers(hash1), issuer);
        assertEq(registry.credentialIssuers(hash2), issuer2);
    }
}

