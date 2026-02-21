package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
	"github.com/zk-kyc-mantle/circuit"
)

func main() {
	fmt.Println("Noah ZK Prover initialized")
	js.Global().Set("generateNoahProof", js.FuncOf(generateNoahProof))
	select {}
}

func generateNoahProof(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: missing input data"
	}

	inputJSON := args[0].String()
	var inputMap map[string]interface{}
	if err := json.Unmarshal([]byte(inputJSON), &inputMap); err != nil {
		return fmt.Sprintf("Error: invalid JSON input: %v", err)
	}

	// 1. Compile Circuit (in production, load pre-compiled R1CS and PK)
	var myCircuit circuit.ZKKYC
	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, &myCircuit)
	if err != nil {
		return fmt.Sprintf("Error compiling circuit: %v", err)
	}

	// 2. Setup (in production, load pre-computed PK)
	pk, _, err := groth16.Setup(ccs)
	if err != nil {
		return fmt.Sprintf("Error setup: %v", err)
	}

	// 3. Prepare Witness from inputMap
	assignment := &circuit.ZKKYC{
		ActualAge:          inputMap["actualAge"],
		ActualJurisdiction: inputMap["actualJurisdiction"],
		ActualAccredited:   inputMap["actualAccredited"],
		CredentialHash:     inputMap["credentialHash"],
		PassportNumber:     inputMap["passportNumber"],
		ExpiryDate:         inputMap["expiryDate"],
		MinAge:             inputMap["minAge"],
		RecipientAddress:   inputMap["recipientAddress"],
		CurrentDate:        inputMap["currentDate"],
	}

	// Set arrays
	if allowedArr, ok := inputMap["allowedJurisdictions"].([]interface{}); ok {
		for i := 0; i < len(allowedArr) && i < 10; i++ {
			assignment.AllowedJurisdictions[i] = allowedArr[i]
		}
	}
	if sanctionedArr, ok := inputMap["sanctionedCountries"].([]interface{}); ok {
		for i := 0; i < len(sanctionedArr) && i < 10; i++ {
			assignment.SanctionedCountries[i] = sanctionedArr[i]
		}
	}
	assignment.RequireAccredited = inputMap["requireAccredited"]
	assignment.CredentialHashPublic = inputMap["credentialHashPublic"]

	witness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		return fmt.Sprintf("Error witness: %v", err)
	}

	// 4. Generate Proof
	proof, err := groth16.Prove(ccs, pk, witness)
	if err != nil {
		return fmt.Sprintf("Error proving: %v", err)
	}

	// 5. Extraction (Stub for demo)
	fmt.Printf("Generated proof: %v\n", proof)

	return map[string]interface{}{
		"status":      "success",
		"message":     "Proof generated",
		"proof":       "proof_hex_placeholder",
		"nullifier":   "nullifier_hex_placeholder",
		"packedFlags": 15,
	}
}
