package circuit

import (
	"testing"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
	"github.com/consensys/gnark/std/math/emulated"
	"github.com/consensys/gnark/std/math/uints"
)

// TestSHA256Circuit verifies the in-circuit SHA-256 gadget compiles correctly.
func TestSHA256Circuit(t *testing.T) {
	circuit := &SHA256Circuit{}
	r1c, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("SHA256 circuit compilation failed: %v", err)
	}
	t.Logf("✅ SHA256 circuit compiled: %d constraints", r1c.GetNbConstraints())
}

// TestZKECDSAP256Circuit verifies ECDSA-P256 circuit compiles.
func TestZKECDSAP256Circuit(t *testing.T) {
	circuit := &ZKECDSA_P256Circuit{}
	r1c, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("ECDSA-P256 circuit compilation failed: %v", err)
	}
	t.Logf("✅ ECDSA-P256 circuit compiled: %d constraints", r1c.GetNbConstraints())
}

// TestZKRSA2048Circuit verifies RSA-2048 circuit compiles.
func TestZKRSA2048Circuit(t *testing.T) {
	circuit := &ZKRSA2048Circuit{}
	r1c, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("RSA-2048 circuit compilation failed: %v", err)
	}
	t.Logf("✅ RSA-2048 circuit compiled: %d constraints", r1c.GetNbConstraints())
}

// TestICÃO9303Circuit verifies the unified ICAO circuit compiles with both crypto backends.
func TestICAO9303Circuit(t *testing.T) {
	circuit := &ICAO9303{}
	r1c, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("ICAO9303 circuit compilation failed: %v", err)
	}
	t.Logf("✅ ICAO9303 circuit compiled: %d constraints", r1c.GetNbConstraints())
}

// TestICÃO9303TD1AgeVerification tests age verification with a TD1 (ID card) input.
func TestICAO9303TD1AgeVerification(t *testing.T) {
	circuit := &ICAO9303{}
	cs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		t.Fatalf("Compile: %v", err)
	}

	pk, vk, err := groth16.Setup(cs)
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}

	// Build a mock TD1 witness (Nigerian NIMC card — 30+30+30 chars)
	mrzRaw := "IDNGAAB123456FA67<<<<<<<<<<<8510670M3211024NGA<<<<<98" +
		"ABUBAKAR<<MOHAMMED<<<<<<<<<<<<<"
	mrzBytes := [93]uints.U8{}
	for i, b := range []byte(mrzRaw) {
		if i >= 93 {
			break
		}
		mrzBytes[i] = uints.NewU8(b)
	}

	witness := &ICAO9303{
		MRZData:      mrzBytes,
		MRZLength:    frontend.Variable(90),  // TD1 = 90 chars
		DocumentType: frontend.Variable(1),   // TD1
		ActualAge:    frontend.Variable(40),  // Born 1985, age 40 in 2025
		ExpiryDate:   frontend.Variable(20321024),
		SigAlgorithm: frontend.Variable(SigAlgRSA),
		// Minimal RSA inputs (empty for test, emulated elements)
		RSASignature: emulated.ValueOf[RSA2048Fp]("0"),
		RSAModulus:   emulated.ValueOf[RSA2048Fp]("2048"),
		// Public inputs
		MinAge:               frontend.Variable(18),
		CurrentDate:          frontend.Variable(20250325),
		AllowedJurisdictions: [10]frontend.Variable{},
		RecipientAddress:     frontend.Variable(0xDEADBEEF),
		CredentialHashPublic: frontend.Variable(0),
	}

	w, err := frontend.NewWitness(witness, ecc.BN254.ScalarField())
	if err != nil {
		t.Fatalf("Witness: %v", err)
	}

	proof, err := groth16.Prove(cs, pk, w)
	if err != nil {
		t.Fatalf("Prove: %v", err)
	}

	publicWitness, _ := w.Public()
	err = groth16.Verify(proof, vk, publicWitness)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	t.Log("✅ ICAO9303 TD1 (NIMC) age verification proof accepted by verifier")
}
