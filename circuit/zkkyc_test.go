package circuit

import (
	"testing"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
	"github.com/consensys/gnark/test"
)

func TestZKKYC_ValidCase(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidAge_TooYoung(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          17, // Too young
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 0 (invalid)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidAge_ExactlyAtMinimum(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          18, // Exactly at minimum (should be valid)
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidAge_OneBelowMinimum(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          17, // One below minimum (should be invalid)
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 0 (invalid)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidJurisdiction_NotInList(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 9999999999, // Not in allowed list
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 0 (invalid)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_ValidJurisdiction_MultipleMatches(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1111111111, // Second in the list
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_ValidJurisdiction_LastInList(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 2222222222, // Third in the list
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidCredentialHash_Mismatch(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 1111111111, // Different hash
		
		// Output - should be 0 (invalid)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidAccreditation_RequiredButNotProvided(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   0, // Not accredited
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1, // Required
		CredentialHashPublic: 9876543210,
		
		// Output - should be 0 (invalid)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_ValidAccreditation_NotRequired(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   0, // Not accredited, but not required
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   0, // Not required
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_ValidAccreditation_RequiredAndProvided(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1, // Accredited
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1, // Required
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_EmptyJurisdictionList(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // All zeros (empty list)
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 0 (invalid, no matching jurisdiction)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_AllChecksFail(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs - all invalid
		ActualAge:          17, // Too young
		ActualJurisdiction: 9999999999, // Not in list
		ActualAccredited:   0, // Not accredited
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 1111111111, // Wrong hash
		
		// Output - should be 0 (all checks fail)
		IsValid: 0,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_HighAge(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          100, // Very old (should still be valid)
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_FullJurisdictionList(t *testing.T) {
	assignment := &ZKKYC{
		// Private inputs
		ActualAge:          28,
		ActualJurisdiction: 9999999999, // Last in full list
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		
		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1111111111, 2222222222, 3333333333, 4444444444, 5555555555,
			6666666666, 7777777777, 8888888888, 9999999999, 1010101010,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		
		// Output - should be 1 (valid)
		IsValid: 1,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_EndToEndProofGeneration(t *testing.T) {
	// Test full proof generation and verification
	circuit := &ZKKYC{}
	
	// Compile circuit
	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("Failed to compile circuit: %v", err)
	}

	// Generate trusted setup
	pk, vk, err := groth16.Setup(ccs)
	if err != nil {
		t.Fatalf("Failed to setup: %v", err)
	}

	// Create valid assignment
	assignment := &ZKKYC{
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		MinAge:             18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		IsValid:             1,
	}

	// Generate witness
	witness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		t.Fatalf("Failed to create witness: %v", err)
	}

	// Generate proof
	proof, err := groth16.Prove(ccs, pk, witness)
	if err != nil {
		t.Fatalf("Failed to generate proof: %v", err)
	}

	// Get public witness
	publicWitness, _ := witness.Public()

	// Verify proof
	err = groth16.Verify(proof, vk, publicWitness)
	if err != nil {
		t.Fatalf("Proof verification failed: %v", err)
	}
}

// Test edge case: jurisdiction = 0 should not match empty slots
func TestZKKYC_JurisdictionZero_NotInEmptyList(t *testing.T) {
	assignment := &ZKKYC{
		ActualAge:          28,
		ActualJurisdiction: 0, // Trying to match with 0
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		MinAge:             18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0, // 0s are empty slots
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		IsValid:             0, // Should be invalid (0 not in list, only empty slots)
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

// Test edge case: jurisdiction = 0 when 0 is explicitly in the list
func TestZKKYC_JurisdictionZero_ExplicitlyInList(t *testing.T) {
	// This test verifies that if we want 0 to be a valid jurisdiction,
	// we need to handle it differently (but current implementation treats 0 as empty)
	// For now, this should fail because 0 is treated as empty
	assignment := &ZKKYC{
		ActualAge:          28,
		ActualJurisdiction: 0,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		MinAge:             18,
		AllowedJurisdictions: [10]frontend.Variable{
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // All zeros (empty list)
		},
		RequireAccredited:   1,
		CredentialHashPublic: 9876543210,
		IsValid:             0, // Should be invalid (0 treated as empty)
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

