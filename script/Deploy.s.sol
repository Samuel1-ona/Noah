// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CredentialRegistry} from "../src/CredentialRegistry.sol";
import {ZKVerifier} from "../src/ZKVerifier.sol";
import {ProtocolAccessControl} from "../src/ProtocolAccessControl.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying ZK-KYC contracts...");
        
        // Deploy Credential Registry
        console.log("Deploying CredentialRegistry...");
        CredentialRegistry registry = new CredentialRegistry();
        console.log("CredentialRegistry deployed at:", address(registry));
        
        // Deploy ZK Verifier
        console.log("Deploying ZKVerifier...");
        ZKVerifier verifier = new ZKVerifier();
        console.log("ZKVerifier deployed at:", address(verifier));
        
        // Deploy Protocol Access Control
        console.log("Deploying ProtocolAccessControl...");
        ProtocolAccessControl accessControl = new ProtocolAccessControl(
            address(verifier),
            address(registry)
        );
        console.log("ProtocolAccessControl deployed at:", address(accessControl));
        
        // Add a test issuer (optional)
        if (vm.envOr("ADD_TEST_ISSUER", false)) {
            address testIssuer = vm.envAddress("TEST_ISSUER_ADDRESS");
            registry.addIssuer(testIssuer, "Test KYC Provider");
            console.log("Test issuer added:", testIssuer);
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("CredentialRegistry:", address(registry));
        console.log("ZKVerifier:", address(verifier));
        console.log("ProtocolAccessControl:", address(accessControl));
    }
}

