// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CredentialRegistry} from "../src/CredentialRegistry.sol";
import {ZKVerifier} from "../src/ZKVerifier.sol";
import {ProtocolAccessControl} from "../src/ProtocolAccessControl.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey;
        if (vm.envExists("PK")) {
            deployerPrivateKey = vm.envUint("PK");
        } else {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== Noah Deployment on Avalanche ===");
        
        // 1. Deploy ZK Verifier
        console.log("Deploying ZKVerifier...");
        ZKVerifier verifier = new ZKVerifier();
        console.log("ZKVerifier deployed at:", address(verifier));
        
        // 2. Deploy Credential Registry
        console.log("Deploying CredentialRegistry...");
        CredentialRegistry registry = new CredentialRegistry();
        console.log("CredentialRegistry deployed at:", address(registry));
        
        // 3. Deploy Protocol Access Control
        // Constructor: ZKVerifier address, CredentialRegistry address
        console.log("Deploying ProtocolAccessControl...");
        ProtocolAccessControl accessControl = new ProtocolAccessControl(
            address(verifier),
            address(registry)
        );
        console.log("ProtocolAccessControl deployed at:", address(accessControl));
        
        // 4. Initialization (Add deployer as a test issuer for demo purposes)
        address deployer = vm.addr(deployerPrivateKey);
        registry.addIssuer(deployer, "Noah Genesis Issuer");
        console.log("Registered deployer as Issuer:", deployer);
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("Verifier: ", address(verifier));
        console.log("Registry: ", address(registry));
        console.log("AccessControl: ", address(accessControl));
        console.log("==========================\n");
    }
}

