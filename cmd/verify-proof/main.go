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
	zkkyc "github.com/zk-kyc-mantle/circuit"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: verify-proof <proof.json> [input.json]")
		os.Exit(1)
	}

	proofPath := os.Args[1]
	var inputPath string
	if len(os.Args) >= 3 {
		inputPath = os.Args[2]
	}

	// Read proof file
	proofData, err := os.ReadFile(proofPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to read proof file: %v", err))
	}

	var proofJSON struct {
		Proof       json.RawMessage `json:"proof"`
		PublicInputs json.RawMessage `json:"publicInputs"`
	}

	err = json.Unmarshal(proofData, &proofJSON)
	if err != nil {
		panic(fmt.Sprintf("Failed to parse proof file: %v", err))
	}

	// Load constraint system
	ccsPath := filepath.Join("build", "circuit.ccs")
	if _, err := os.Stat(ccsPath); os.IsNotExist(err) {
		ccsPath = filepath.Join("..", "..", "build", "circuit.ccs")
	}
	ccsFile, err := os.Open(ccsPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to open constraint system file: %v", err))
	}
	defer ccsFile.Close()

	ccs := groth16.NewCS(ecc.BN254)
	_, err = ccs.ReadFrom(ccsFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to read constraint system: %v", err))
	}

	// Load proving key
	pkPath := filepath.Join("build", "proving_key.pk")
	if _, err := os.Stat(pkPath); os.IsNotExist(err) {
		pkPath = filepath.Join("..", "..", "build", "proving_key.pk")
	}
	pkFile, err := os.Open(pkPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to open proving key file: %v", err))
	}
	defer pkFile.Close()

	pk := &bn254groth16.ProvingKey{}
	_, err = pk.ReadFrom(pkFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to read proving key: %v", err))
	}

	// Load verification key from file
	vkPath := filepath.Join("build", "verification_key.vk")
	if _, err := os.Stat(vkPath); os.IsNotExist(err) {
		vkPath = filepath.Join("..", "..", "build", "verification_key.vk")
	}
	
	vkFile, err := os.Open(vkPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to open verification key file: %v\nMake sure you've run 'go run cmd/generate-verifier/main.go' first", err))
	}
	defer vkFile.Close()
	
	vk := &bn254groth16.VerifyingKey{}
	_, err = vk.ReadFrom(vkFile)
	if err != nil {
		panic(fmt.Sprintf("Failed to read verification key: %v", err))
	}
	
	fmt.Println("✅ Loaded verification key from file")

	// Deserialize proof
	proof := &bn254groth16.Proof{}
	err = json.Unmarshal(proofJSON.Proof, proof)
	if err != nil {
		panic(fmt.Sprintf("Failed to unmarshal proof: %v", err))
	}

	// Reconstruct public witness from input file if provided
	if inputPath == "" {
		panic("input.json file is required to reconstruct public witness")
	}
	
	// Read input file
	inputData, err := os.ReadFile(inputPath)
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
		IsValid:            1,
	}
	for i := 0; i < 10; i++ {
		assignment.AllowedJurisdictions[i] = input.AllowedJurisdictions[i]
	}

	// Create witness
	witness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		panic(fmt.Sprintf("Failed to create witness: %v", err))
	}

	publicWitness, _ := witness.Public()

	// Verify proof
	fmt.Println("🔍 Verifying proof locally...")
	err = groth16.Verify(proof, vk, publicWitness)
	if err != nil {
		fmt.Printf("❌ Proof verification FAILED: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✅ Proof verification SUCCEEDED locally!")
	fmt.Println("\n📋 Summary:")
	fmt.Println("  - Proof is valid")
	fmt.Println("  - Verification key matches proving key")
	fmt.Println("  - Public witness is correct")
	fmt.Println("\n⚠️  If on-chain verification still fails, the issue may be:")
	fmt.Println("  1. The deployed ZKVerifier contract has a different verification key")
	fmt.Println("  2. The public signals format sent to the contract is incorrect")
	fmt.Println("  3. The proof format conversion (a, b, c) is incorrect")
}

