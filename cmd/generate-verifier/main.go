package main

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	bn254groth16 "github.com/consensys/gnark/backend/groth16/bn254"
	"github.com/consensys/gnark/backend/solidity"
	"github.com/consensys/gnark/constraint"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
	zkkyc "github.com/zk-kyc-mantle/circuit"
)

func main() {
	// Create the circuit
	circuit := &zkkyc.ZKKYC{}

	// Compile the circuit to R1CS
	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		panic(fmt.Sprintf("Failed to compile circuit: %v", err))
	}

	// Generate production trusted setup
	// gnark's groth16.Setup() generates cryptographically secure random parameters
	// This is secure for production, but uses a single-party setup
	// For maximum trust, consider using a multi-party ceremony (PPOT)
	pk, vk, err := groth16.Setup(ccs)
	if err != nil {
		panic(fmt.Sprintf("Failed to setup: %v", err))
	}

	// Save proving key to file
	pkPath := filepath.Join("build", "proving_key.pk")
	err = os.MkdirAll(filepath.Dir(pkPath), 0755)
	if err != nil {
		panic(fmt.Sprintf("Failed to create build directory: %v", err))
	}

	pkFile, err := os.Create(pkPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to create proving key file: %v", err))
	}
	defer pkFile.Close()

	_, err = pk.WriteTo(pkFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to write proving key: %v", err))
	}

	// Save constraint system (needed for proof generation)
	ccsPath := filepath.Join("build", "circuit.ccs")
	ccsFile, err := os.Create(ccsPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to create constraint system file: %v", err))
	}
	defer ccsFile.Close()

	_, err = ccs.WriteTo(ccsFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to write constraint system: %v", err))
	}

	// Save verification key (needed for proof verification)
	vkPath := filepath.Join("build", "verification_key.vk")
	vkFile, err := os.Create(vkPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to create verification key file: %v", err))
	}
	defer vkFile.Close()

	_, err = vk.WriteTo(vkFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to write verification key: %v", err))
	}

	// Generate Solidity verifier contract
	verifierCode, err := generateVerifierSolidity(vk)
	if err != nil {
		panic(fmt.Sprintf("Failed to generate Solidity verifier: %v", err))
	}

	// Wrap the verifier code to match our interface
	wrappedVerifier := wrapVerifier(verifierCode, ccs)

	// Save verifier contract
	outputPath := filepath.Join("src", "ZKVerifier.sol")
	err = os.WriteFile(outputPath, []byte(wrappedVerifier), 0644)
	if err != nil {
		panic(fmt.Sprintf("Failed to write verifier: %v", err))
	}

	// Test the circuit
	testCircuit(ccs, pk, vk)
}

func generateVerifierSolidity(vk groth16.VerifyingKey) (string, error) {
	// Cast to BN254 specific type to access ExportSolidity
	bn254Vk, ok := vk.(*bn254groth16.VerifyingKey)
	if !ok {
		return "", fmt.Errorf("verifying key is not BN254 type")
	}

	// Create a buffer to write the Solidity code
	var buf bytes.Buffer

	// Export Solidity verifier with pragma version 0.8.20
	err := bn254Vk.ExportSolidity(&buf, solidity.WithPragmaVersion("^0.8.20"))
	if err != nil {
		return "", fmt.Errorf("failed to export Solidity: %w", err)
	}

	return buf.String(), nil
}

func wrapVerifier(verifierCode string, ccs constraint.ConstraintSystem) string {
	// The gnark-generated verifier contract is named "Verifier"
	// We need to rename it to "ZKVerifier" and make it implement IZKVerifier

	modifiedCode := verifierCode

	// Add import statement
	importStmt := `import "./IZKVerifier.sol";

`

	// Replace "contract Verifier" with "contract ZKVerifier is IZKVerifier"
	contractStart := "contract Verifier"
	contractReplacement := "contract ZKVerifier is IZKVerifier"

	// Replace the contract declaration
	if idx := findContractStart(modifiedCode); idx >= 0 {
		// Insert import before the contract
		modifiedCode = modifiedCode[:idx] + importStmt + modifiedCode[idx:]
		// Replace contract name
		modifiedCode = replaceFirst(modifiedCode, contractStart, contractReplacement)
	} else {
		// Fallback: simple replacement
		modifiedCode = importStmt + modifiedCode
		modifiedCode = replaceFirst(modifiedCode, contractStart, contractReplacement)
	}

	// Rename the gnark-generated verifyProof function to verifyProofGnark
	// This avoids conflict with our wrapper function that implements IZKVerifier
	// Use simple string replacement - gnark always generates the same signature
	modifiedCode = string(bytes.ReplaceAll([]byte(modifiedCode),
		[]byte("function verifyProof(\n        uint256[8] calldata proof,\n        uint256[28] calldata input\n    ) public view {"),
		[]byte("function verifyProofGnark(\n        uint256[8] calldata proof,\n        uint256[28] calldata input\n    ) public view {")))

	// Add the verifyProof function that implements IZKVerifier
	// Note: The interface expects uint[14] for publicSignals (14 public inputs)
	verifyProofFunc := `
    
    /**
     * @notice Verify a ZK proof (implements IZKVerifier interface)
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
    ) external view override returns (bool) {
        // Convert proof format: [a[2], b[2][2], c[2]] to flat array
        // gnark's verify expects: [a_x, a_y, b_x0, b_x1, b_y0, b_y1, c_x, c_y]
        uint256[8] memory proofArray;
        proofArray[0] = a[0];
        proofArray[1] = a[1];
        proofArray[2] = b[0][0];
        proofArray[3] = b[0][1];
        proofArray[4] = b[1][0];
        proofArray[5] = b[1][1];
        proofArray[6] = c[0];
        proofArray[7] = c[1];
        
        // Call the gnark-generated verifyProofGnark function
        try this.verifyProofGnark(proofArray, publicSignals) {
            return true;
        } catch {
            return false;
        }
    }
`

	// Insert before the last closing brace (the one that closes the contract)
	lastBrace := findLastBrace(modifiedCode)
	if lastBrace > 0 {
		// Insert before the closing brace, not after
		modifiedCode = modifiedCode[:lastBrace] + verifyProofFunc + "\n" + modifiedCode[lastBrace:]
	} else {
		// Fallback: find the last } and insert before it
		lastIdx := strings.LastIndex(modifiedCode, "}")
		if lastIdx > 0 {
			modifiedCode = modifiedCode[:lastIdx] + verifyProofFunc + "\n" + modifiedCode[lastIdx:]
		} else {
			modifiedCode = modifiedCode + verifyProofFunc
		}
	}

	return modifiedCode
}

// Helper functions for string manipulation
func findContractStart(s string) int {
	idx := 0
	for idx < len(s) {
		if idx+len("contract Verifier") <= len(s) && s[idx:idx+len("contract Verifier")] == "contract Verifier" {
			// Find the start of the line (go back to find pragma or previous line)
			lineStart := idx
			for lineStart > 0 && s[lineStart-1] != '\n' {
				lineStart--
			}
			return lineStart
		}
		idx++
	}
	return -1
}

func replaceFirst(s, old, new string) string {
	if idx := findContractStart(s); idx >= 0 {
		// Find the exact match
		contractIdx := idx
		for contractIdx < len(s) && s[contractIdx:contractIdx+len(old)] != old {
			contractIdx++
		}
		if contractIdx < len(s) {
			return s[:contractIdx] + new + s[contractIdx+len(old):]
		}
	}
	// Simple fallback
	return s
}

func findLastBrace(s string) int {
	// Find the last closing brace that's not in a comment or string
	depth := 0
	lastBrace := -1
	inString := false
	inComment := false

	for i := 0; i < len(s); i++ {
		if i < len(s)-1 && s[i:i+2] == "//" {
			inComment = true
		}
		if s[i] == '\n' {
			inComment = false
		}
		if !inComment && !inString {
			if s[i] == '"' {
				inString = !inString
			} else if s[i] == '{' {
				depth++
			} else if s[i] == '}' {
				depth--
				if depth == 0 {
					lastBrace = i
				}
			}
		}
	}
	return lastBrace
}

func replaceFunctionName(s, oldName, newName string) string {
	// Replace function name, but only the function declaration, not calls to it
	// Look for "function verifyProof(" pattern
	oldPattern := oldName
	newPattern := newName

	// Simple replacement - this should work because gnark generates "function verifyProof("
	// and we want to rename it to "function verifyProofGnark("
	result := s
	idx := 0
	for {
		pos := findString(result[idx:], oldPattern)
		if pos == -1 {
			break
		}
		actualPos := idx + pos
		// Make sure it's a function declaration (check for "function " before it)
		if actualPos >= 9 && result[actualPos-9:actualPos] == "function " {
			result = result[:actualPos] + newPattern + result[actualPos+len(oldPattern):]
			idx = actualPos + len(newPattern)
		} else {
			idx = actualPos + len(oldPattern)
		}
		if idx >= len(result) {
			break
		}
	}
	return result
}

func findString(s, pattern string) int {
	for i := 0; i <= len(s)-len(pattern); i++ {
		if s[i:i+len(pattern)] == pattern {
			return i
		}
	}
	return -1
}

func testCircuit(ccs constraint.ConstraintSystem, pk groth16.ProvingKey, vk groth16.VerifyingKey) {
	// Create test assignment
	// All fields must be set, including output fields
	assignment := &zkkyc.ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		PassportNumber:     1357924680,
		ExpiryDate:         1893456000, // 2030-01-01

		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:    1,
		CredentialHashPublic: 9876543210,
		AppID:                55555,
		CurrentDate:          1740052800, // 2025-02-20
		SanctionedCountries:  [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},

		// Output fields
		IsValid:     1,
		Nullifier:   1357924680 + 55555,
		PackedFlags: 15, // 1 + 2 + 4 + 8 = 15
	}

	// Generate witness
	witness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		panic(fmt.Sprintf("Failed to create witness: %v", err))
	}

	// Generate proof
	proof, err := groth16.Prove(ccs, pk, witness)
	if err != nil {
		panic(fmt.Sprintf("Failed to generate proof: %v", err))
	}

	// Get public witness
	publicWitness, _ := witness.Public()

	// Verify proof
	err = groth16.Verify(proof, vk, publicWitness)
	if err != nil {
		panic(fmt.Sprintf("Proof verification failed: %v", err))
	}
}
