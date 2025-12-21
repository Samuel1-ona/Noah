// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
     * @param publicSignals The public signals array (14 elements)
     * @dev Public signals order: [0]=minAge, [1-10]=allowedJurisdictions, [11]=requireAccredited, [12]=credentialHashPublic, [13]=isValid
     * @return isValid True if the proof is valid
     */
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[14] memory publicSignals
    ) external view returns (bool isValid);
}

