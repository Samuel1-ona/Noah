// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ProtocolAccessControl} from "../src/ProtocolAccessControl.sol";
import {CredentialRegistry} from "../src/CredentialRegistry.sol";
import {IZKVerifier} from "../src/IZKVerifier.sol";

// Mock ZK Verifier for testing
contract MockZKVerifier is IZKVerifier {
    bool public shouldVerify = true;
    
    function setShouldVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }
    
    function verifyProof(
        uint[2] memory,
        uint[2][2] memory,
        uint[2] memory,
        uint[14] memory
    ) external view override returns (bool) {
        return shouldVerify;
    }
}

contract ProtocolAccessControlTest is Test {
    ProtocolAccessControl public accessControl;
    CredentialRegistry public registry;
    MockZKVerifier public verifier;
    
    address public protocol;
    address public user;
    address public issuer;
    bytes32 public credentialHash;
    
    function setUp() public {
        verifier = new MockZKVerifier();
        registry = new CredentialRegistry();
        accessControl = new ProtocolAccessControl(
            address(verifier),
            address(registry)
        );
        
        protocol = address(0x1);
        user = address(0x2);
        issuer = address(0x3);
        credentialHash = keccak256("test-credential");
        
        // Setup registry
        registry.addIssuer(issuer, "Test KYC Provider");
        vm.prank(issuer);
        registry.registerCredential(credentialHash, user);
    }
    
    function test_SetRequirements() public {
        uint256[] memory jurisdictions = new uint256[](2);
        jurisdictions[0] = 1234567890;
        jurisdictions[1] = 1111111111;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, true);
        
        (
            uint256 minAge,
            uint256[] memory allowedJurisdictions,
            bool requireAccredited
        ) = accessControl.getRequirements(protocol);
        
        assertEq(minAge, 18);
        assertEq(allowedJurisdictions.length, 2);
        assertTrue(requireAccredited);
    }
    
    function test_VerifyAndGrantAccess() public {
        // Set requirements
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        // Prepare proof (mock)
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18; // minAge
        publicSignals[11] = 0; // requireAccredited = false
        publicSignals[12] = uint256(credentialHash); // credentialHash
        
        // Verify and grant access
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        assertTrue(accessControl.hasAccess(protocol, user));
    }
    
    function test_VerifyAndGrantAccess_RequirementsNotSet() public {
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        
        vm.prank(protocol);
        vm.expectRevert("Requirements not set");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
    }
    
    function test_VerifyAndGrantAccess_InvalidCredential() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        bytes32 invalidHash = keccak256("invalid");
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        
        vm.prank(protocol);
        vm.expectRevert("Invalid or revoked credential");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, invalidHash, user);
    }
    
    function test_RevokeAccess() public {
        // First grant access
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        // Then revoke
        vm.prank(protocol);
        accessControl.revokeAccess(user);
        
        assertFalse(accessControl.hasAccess(protocol, user));
    }
    
    // ============ EDGE CASE TESTS ============
    
    function test_SetRequirements_TooManyJurisdictions() public {
        uint256[] memory jurisdictions = new uint256[](11);
        for (uint i = 0; i < 11; i++) {
            jurisdictions[i] = i;
        }
        
        vm.prank(protocol);
        vm.expectRevert("Too many jurisdictions");
        accessControl.setRequirements(18, jurisdictions, false);
    }
    
    function test_SetRequirements_MaxJurisdictions() public {
        uint256[] memory jurisdictions = new uint256[](10);
        for (uint i = 0; i < 10; i++) {
            jurisdictions[i] = i;
        }
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        (,, bool requireAccredited) = accessControl.getRequirements(protocol);
        assertFalse(requireAccredited);
    }
    
    function test_SetRequirements_EmptyJurisdictions() public {
        uint256[] memory jurisdictions = new uint256[](0);
        
        vm.prank(protocol);
        accessControl.setRequirements(21, jurisdictions, true);
        
        (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited) = 
            accessControl.getRequirements(protocol);
        assertEq(minAge, 21);
        assertEq(allowedJurisdictions.length, 0);
        assertTrue(requireAccredited);
    }
    
    function test_SetRequirements_UpdateRequirements() public {
        uint256[] memory jurisdictions1 = new uint256[](1);
        jurisdictions1[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions1, false);
        
        uint256[] memory jurisdictions2 = new uint256[](2);
        jurisdictions2[0] = 1111111111;
        jurisdictions2[1] = 2222222222;
        
        vm.prank(protocol);
        accessControl.setRequirements(21, jurisdictions2, true);
        
        (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited) = 
            accessControl.getRequirements(protocol);
        assertEq(minAge, 21);
        assertEq(allowedJurisdictions.length, 2);
        assertTrue(requireAccredited);
    }
    
    function test_VerifyAndGrantAccess_RevokedCredential() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        // Revoke credential
        vm.prank(issuer);
        registry.revokeCredential(credentialHash);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        vm.expectRevert("Invalid or revoked credential");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
    }
    
    function test_VerifyAndGrantAccess_InvalidProof() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        verifier.setShouldVerify(false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        vm.expectRevert("Invalid proof");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
    }
    
    function test_VerifyAndGrantAccess_AgeMismatch() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(21, jurisdictions, false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18; // Mismatch: protocol requires 21
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        vm.expectRevert("Age requirement mismatch");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
    }
    
    function test_VerifyAndGrantAccess_AccreditationMismatch() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, true); // Requires accredited
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0; // Mismatch: protocol requires 1 (accredited)
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        vm.expectRevert("Accreditation requirement mismatch");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
    }
    
    function test_VerifyAndGrantAccess_CredentialHashMismatch() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        // Register a second credential so we can test hash mismatch
        bytes32 wrongHash = keccak256("wrong-hash");
        vm.prank(issuer);
        registry.registerCredential(wrongHash, user);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash); // Public signal has different hash than parameter
        
        // Use wrongHash as parameter but public signal has credentialHash
        // This should fail at credential hash mismatch check
        vm.prank(protocol);
        vm.expectRevert("Credential hash mismatch");
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, wrongHash, user);
    }
    
    function test_VerifyAndGrantAccess_ZeroAddressUser() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        // Should allow zero address user (edge case)
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, address(0));
        
        assertTrue(accessControl.hasAccess(protocol, address(0)));
    }
    
    function test_VerifyAndGrantAccess_MultipleProtocols() public {
        address protocol2 = address(0xC);
        
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        vm.prank(protocol2);
        accessControl.setRequirements(21, jurisdictions, true);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        assertTrue(accessControl.hasAccess(protocol, user));
        assertFalse(accessControl.hasAccess(protocol2, user));
    }
    
    function test_RevokeAccess_NonExistent() public {
        vm.prank(protocol);
        vm.expectRevert("User does not have access");
        accessControl.revokeAccess(user);
    }
    
    function test_RevokeAccess_ThenRegrant() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        vm.prank(protocol);
        accessControl.revokeAccess(user);
        
        // Can regrant access
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        assertTrue(accessControl.hasAccess(protocol, user));
    }
    
    function test_CheckAccess_NonExistent() public {
        vm.prank(protocol);
        assertFalse(accessControl.checkAccess(user));
    }
    
    function test_GetRequirements_NonExistent() public {
        address nonExistentProtocol = address(0xD);
        
        (uint256 minAge, uint256[] memory allowedJurisdictions, bool requireAccredited) = 
            accessControl.getRequirements(nonExistentProtocol);
        
        assertEq(minAge, 0);
        assertEq(allowedJurisdictions.length, 0);
        assertFalse(requireAccredited);
    }
    
    function test_VerifyAndGrantAccess_PublicSignalsBoundary() public {
        uint256[] memory jurisdictions = new uint256[](10);
        for (uint i = 0; i < 10; i++) {
            jurisdictions[i] = i + 1000;
        }
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        // Fill all 10 jurisdiction slots
        for (uint i = 0; i < 10; i++) {
            publicSignals[i + 1] = i + 1000;
        }
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        assertTrue(accessControl.hasAccess(protocol, user));
    }
    
    function test_UserCredentials_Mapping() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = 1234567890;
        
        vm.prank(protocol);
        accessControl.setRequirements(18, jurisdictions, false);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = 18;
        publicSignals[11] = 0;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        assertEq(accessControl.userCredentials(protocol, user), credentialHash);
    }
    
    function test_VerifyAndGrantAccess_MaxUint256Values() public {
        uint256[] memory jurisdictions = new uint256[](1);
        jurisdictions[0] = type(uint256).max;
        
        vm.prank(protocol);
        accessControl.setRequirements(type(uint256).max, jurisdictions, true);
        
        uint[2] memory a = [uint(1), uint(2)];
        uint[2][2] memory b = [[uint(3), uint(4)], [uint(5), uint(6)]];
        uint[2] memory c = [uint(7), uint(8)];
        uint[13] memory publicSignals;
        publicSignals[0] = type(uint256).max;
        publicSignals[1] = type(uint256).max;
        publicSignals[11] = 1;
        publicSignals[12] = uint256(credentialHash);
        
        vm.prank(protocol);
        accessControl.verifyAndGrantAccess(a, b, c, publicSignals, credentialHash, user);
        
        assertTrue(accessControl.hasAccess(protocol, user));
    }
}

