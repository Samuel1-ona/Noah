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
		PassportNumber:     1357924680,
		ExpiryDate:         1893456000, // 2030-01-01

		// Public inputs
		MinAge: 18,
		AllowedJurisdictions: [10]frontend.Variable{
			1234567890, 1111111111, 2222222222, 0, 0, 0, 0, 0, 0, 0,
		},
		RequireAccredited:    1,
		CredentialHashPublic: 9876543210,
		RecipientAddress:     12345,      // Bound to user's wallet
		CurrentDate:          1740052800, // 2025-02-20
		SanctionedCountries:  [10]frontend.Variable{1122334455, 0, 0, 0, 0, 0, 0, 0, 0, 0},

		// Output
		IsValid:     1,
		Nullifier:   1357924680, // Identity nullifier (independent of app)
		PackedFlags: 15,         // isOver18=1, isOver21=1, expiryValid=1, isNotSanctioned=1 -> 1+2+4+8=15
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_InvalidAge_TooYoung(t *testing.T) {
	assignment := &ZKKYC{
		ActualAge:          17, // Too young
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		PassportNumber:     1357924680,
		ExpiryDate:         1893456000,

		MinAge:               18,
		AllowedJurisdictions: [10]frontend.Variable{1234567890, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		RequireAccredited:    1,
		CredentialHashPublic: 9876543210,
		RecipientAddress:     12345,
		CurrentDate:          1740052800,
		SanctionedCountries:  [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},

		IsValid:     0,
		Nullifier:   1357924680,
		PackedFlags: 8 + 4, // isNotSanctioned=1, expiryValid=1, others=0 -> 8+4=12 (isOver18=0 since 17 < 18)
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_ExpiredPassport(t *testing.T) {
	assignment := &ZKKYC{
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		PassportNumber:     1357924680,
		ExpiryDate:         1735689600, // 2025-01-01 (Expired)

		MinAge:               18,
		AllowedJurisdictions: [10]frontend.Variable{1234567890, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		RequireAccredited:    1,
		CredentialHashPublic: 9876543210,
		RecipientAddress:     12345,
		CurrentDate:          1740052800, // 2025-02-20
		SanctionedCountries:  [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},

		IsValid:     0,
		Nullifier:   1357924680,
		PackedFlags: 1 + 2 + 8, // isOver18=1, isOver21=1, isNotSanctioned=1, expiryValid=0 -> 1+2+8=11
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_SanctionedCountry(t *testing.T) {
	assignment := &ZKKYC{
		ActualAge:          28,
		ActualJurisdiction: 666, // Sanctioned
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		PassportNumber:     1357924680,
		ExpiryDate:         1893456000,

		MinAge:               18,
		AllowedJurisdictions: [10]frontend.Variable{666, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		RequireAccredited:    1,
		CredentialHashPublic: 9876543210,
		RecipientAddress:     12345,
		CurrentDate:          1740052800,
		SanctionedCountries:  [10]frontend.Variable{666, 0, 0, 0, 0, 0, 0, 0, 0, 0},

		IsValid:     0,
		Nullifier:   1357924680,
		PackedFlags: 1 + 2 + 4, // isOver18=1, isOver21=1, expiryValid=1, isNotSanctioned=0 -> 1+2+4=7
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment)
}

func TestZKKYC_EndToEndProofGeneration(t *testing.T) {
	circuit := &ZKKYC{}

	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("Failed to compile circuit: %v", err)
	}

	pk, vk, err := groth16.Setup(ccs)
	if err != nil {
		t.Fatalf("Failed to setup: %v", err)
	}

	assignment := &ZKKYC{
		ActualAge:          28,
		ActualJurisdiction: 1234567890,
		ActualAccredited:   1,
		CredentialHash:     9876543210,
		PassportNumber:     1357924680,
		ExpiryDate:         1893456000,

		MinAge:               18,
		AllowedJurisdictions: [10]frontend.Variable{1234567890, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		RequireAccredited:    1,
		CredentialHashPublic: 9876543210,
		RecipientAddress:     12345,
		CurrentDate:          1740052800,
		SanctionedCountries:  [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},

		IsValid:     1,
		Nullifier:   1357924680,
		PackedFlags: 15,
	}

	witness, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		t.Fatalf("Failed to create witness: %v", err)
	}

	proof, err := groth16.Prove(ccs, pk, witness)
	if err != nil {
		t.Fatalf("Failed to generate proof: %v", err)
	}

	publicWitness, _ := witness.Public()

	err = groth16.Verify(proof, vk, publicWitness)
	if err != nil {
		t.Fatalf("Proof verification failed: %v", err)
	}
}

func TestZKKYC_GlobalNullifier(t *testing.T) {
	// Same passport -> Same global nullifier regardless of recipient
	passport := 12345
	recipient1 := 111
	recipient2 := 222
	expectedNullifier := passport

	assignment1 := &ZKKYC{
		PassportNumber:   passport,
		RecipientAddress: recipient1,
		Nullifier:        expectedNullifier,
		ActualAge:        25, MinAge: 18, ActualJurisdiction: 1,
		AllowedJurisdictions: [10]frontend.Variable{1, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		ActualAccredited:     0, RequireAccredited: 0, CredentialHash: 1, CredentialHashPublic: 1,
		ExpiryDate: 1893456000, CurrentDate: 1740052800,
		SanctionedCountries: [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		IsValid:             1, PackedFlags: 15,
	}

	assert := test.NewAssert(t)
	assert.ProverSucceeded(&ZKKYC{}, assignment1)

	// Different Recipient -> SAME nullifier (Global identity)
	assignment2 := &ZKKYC{
		PassportNumber:   passport,
		RecipientAddress: recipient2,
		Nullifier:        expectedNullifier,
		ActualAge:        25, MinAge: 18, ActualJurisdiction: 1,
		AllowedJurisdictions: [10]frontend.Variable{1, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		ActualAccredited:     0, RequireAccredited: 0, CredentialHash: 1, CredentialHashPublic: 1,
		ExpiryDate: 1893456000, CurrentDate: 1740052800,
		SanctionedCountries: [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		IsValid:             1, PackedFlags: 15,
	}
	assert.ProverSucceeded(&ZKKYC{}, assignment2)
}

func TestZKKYC_ExpiryCheck_Boundary(t *testing.T) {
	assert := test.NewAssert(t)

	// Valid: Expiry is one second after current date
	assignmentValid := &ZKKYC{
		ExpiryDate:  1740052801,
		CurrentDate: 1740052800,
		IsValid:     1,
		// ... valid defaults
		ActualAge: 25, MinAge: 18, ActualJurisdiction: 1,
		AllowedJurisdictions: [10]frontend.Variable{1, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		ActualAccredited:     0, RequireAccredited: 0, CredentialHash: 1, CredentialHashPublic: 1,
		PassportNumber: 1, AppID: 1, Nullifier: 2,
		SanctionedCountries: [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		PackedFlags:         15,
	}
	assert.ProverSucceeded(&ZKKYC{}, assignmentValid)

	// Invalid: Expiry is SAME as current date
	// Circuit uses > current date
	assignmentInvalid := &ZKKYC{
		ExpiryDate:  1740052800,
		CurrentDate: 1740052800,
		IsValid:     0,
		// ... valid defaults
		ActualAge: 25, MinAge: 18, ActualJurisdiction: 1,
		AllowedJurisdictions: [10]frontend.Variable{1, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		ActualAccredited:     0, RequireAccredited: 0, CredentialHash: 1, CredentialHashPublic: 1,
		PassportNumber: 1, RecipientAddress: 1, Nullifier: 1,
		SanctionedCountries: [10]frontend.Variable{0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		PackedFlags:         15,
	}
	assert.ProverSucceeded(&ZKKYC{}, assignmentInvalid)
}
