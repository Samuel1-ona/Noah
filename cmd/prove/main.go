package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	bn254groth16 "github.com/consensys/gnark/backend/groth16/bn254"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
	zkkyc "github.com/zk-kyc-mantle/circuit"
)

// Proof represents a ZK proof
type Proof struct {
	A [2]string   `json:"a"`
	B [2][2]string `json:"b"`
	C [2]string   `json:"c"`
}

// PublicSignals represents the public signals
type PublicSignals struct {
	Signals []string `json:"signals"`
}

func main() {
	if len(os.Args) < 2 {
		os.Exit(1)
	}

	inputFile := os.Args[1]

	// Read input
	inputData, err := os.ReadFile(inputFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to read input file: %v", err))
	}

	var input struct {
		ActualAge          int64   `json:"actualAge"`
		ActualJurisdiction int64   `json:"actualJurisdiction"`
		ActualAccredited   int64   `json:"actualAccredited"`
		CredentialHash     int64   `json:"credentialHash"`
		MinAge             int64   `json:"minAge"`
		AllowedJurisdictions [10]int64 `json:"allowedJurisdictions"`
		RequireAccredited  int64   `json:"requireAccredited"`
		CredentialHashPublic int64 `json:"credentialHashPublic"`
	}

	err = json.Unmarshal(inputData, &input)
	if err != nil {
		panic(fmt.Sprintf("Failed to parse input: %v", err))
	}

	// Create assignment
	assignment := &zkkyc.ZKKYC{
		ActualAge:          input.ActualAge,
		ActualJurisdiction: input.ActualJurisdiction,
		ActualAccredited:   input.ActualAccredited,
		CredentialHash:     input.CredentialHash,
		MinAge:             input.MinAge,
		RequireAccredited:  input.RequireAccredited,
		CredentialHashPublic: input.CredentialHashPublic,
	}

	for i := 0; i < 10; i++ {
		assignment.AllowedJurisdictions[i] = input.AllowedJurisdictions[i]
	}

	// Set output field (required by gnark)
	assignment.IsValid = 1

	// First, compile the circuit to register hints (needed for witness creation)
	// This registers all hint functions used by the circuit
	circuit := &zkkyc.ZKKYC{}
	_, err = frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		panic(fmt.Sprintf("Failed to compile circuit (for hint registration): %v", err))
	}

	// Now load the EXACT constraint system that was used to generate the proving key
	// This ensures the constraint system matches the proving key perfectly
	ccsPath := filepath.Join("build", "circuit.ccs")
	if _, err := os.Stat(ccsPath); os.IsNotExist(err) {
		ccsPath = filepath.Join("..", "..", "build", "circuit.ccs")
	}
	ccsFile, err := os.Open(ccsPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to open constraint system file: %v\nMake sure you've run 'go run cmd/generate-verifier/main.go' first", err))
	}
	defer ccsFile.Close()

	// Load the constraint system from file
	// This is the EXACT constraint system used to generate the proving key
	ccs := groth16.NewCS(ecc.BN254)
	_, err = ccs.ReadFrom(ccsFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to read constraint system: %v", err))
	}

	// Load proving key
	// Use absolute path or relative to project root
	pkPath := filepath.Join("build", "proving_key.pk")
	// If not found, try relative path from cmd/prove
	if _, err := os.Stat(pkPath); os.IsNotExist(err) {
		pkPath = filepath.Join("..", "..", "build", "proving_key.pk")
	}
	pkFile, err := os.Open(pkPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to open proving key file: %v\nMake sure you've run 'go run cmd/generate-verifier/main.go' first", err))
	}
	defer pkFile.Close()

	pk := &bn254groth16.ProvingKey{}
	_, err = pk.ReadFrom(pkFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to read proving key: %v", err))
	}

	// Create witness using the loaded constraint system
	// The constraint system has hints embedded, so we can create witness directly
	// We need to use the constraint system's solver to properly handle hints
	witness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		panic(fmt.Sprintf("Failed to create witness: %v", err))
	}
	
	// The witness needs to be solved using the loaded constraint system
	// This ensures hints are properly evaluated
	// Note: frontend.NewWitness already handles hint evaluation if hints are registered
	// Since we compiled the circuit earlier, hints should be registered

	// Generate proof
	proof, err := groth16.Prove(ccs, pk, witness)
	if err != nil {
		panic(fmt.Sprintf("Failed to generate proof: %v", err))
	}

	// Serialize proof
	proofJSON, err := json.Marshal(proof)
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal proof: %v", err))
	}

	// Manually construct public signals array from input
	// Public signals order: [0]=minAge, [1-10]=allowedJurisdictions, [11]=requireAccredited, [12]=credentialHashPublic, [13]=isValid
	// Note: The circuit has 14 public inputs, but we output 13 (excluding isValid which is computed)
	publicSignals := []string{
		fmt.Sprintf("%d", input.MinAge),
	}
	for i := 0; i < 10; i++ {
		publicSignals = append(publicSignals, fmt.Sprintf("%d", input.AllowedJurisdictions[i]))
	}
	publicSignals = append(publicSignals, fmt.Sprintf("%d", input.RequireAccredited))
	publicSignals = append(publicSignals, fmt.Sprintf("%d", input.CredentialHashPublic))
	// Note: isValid is the 14th public input but is computed by the circuit, so we don't include it in the output

	publicSignalsJSON, err := json.Marshal(publicSignals)
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal public signals: %v", err))
	}

	// Save proof to file
	// Try project root first, then relative from cmd/prove
	proofPath := filepath.Join("build", "proof.json")
	if _, err := os.Stat(filepath.Dir(proofPath)); os.IsNotExist(err) {
		proofPath = filepath.Join("..", "..", "build", "proof.json")
		// Ensure build directory exists
		if err := os.MkdirAll(filepath.Dir(proofPath), 0755); err != nil {
			panic(fmt.Sprintf("Failed to create build directory: %v", err))
		}
	}
	proofData := map[string]interface{}{
		"proof":        json.RawMessage(proofJSON),
		"publicInputs": json.RawMessage(publicSignalsJSON),
	}
	
	proofJSONData, err := json.MarshalIndent(proofData, "", "  ")
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal proof data: %v", err))
	}

	err = os.WriteFile(proofPath, proofJSONData, 0644)
	if err != nil {
		panic(fmt.Sprintf("Failed to write proof file: %v", err))
	}
}

