package circuit

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/hash/mimc"
	"github.com/consensys/gnark/std/math/emulated"
)

// Aadhaar represents the ZK circuit for Aadhaar QR verification
type Aadhaar struct {
	// Private inputs
	ActualAge      frontend.Variable `gnark:"actualAge"`
	Gender         frontend.Variable `gnark:"gender"`
	Signature      emulated.Element[RSA2048Fp] `gnark:"signature"` // RSA-2048
	CredentialHash frontend.Variable `gnark:"credentialHash"`

	// Public inputs
	MinAge               frontend.Variable     `gnark:",public"`
	RequiredGender       frontend.Variable     `gnark:",public"`
	RecipientAddress     frontend.Variable     `gnark:",public"`
	CredentialHashPublic frontend.Variable     `gnark:",public"`

	// Outputs
	IsValid   frontend.Variable `gnark:",public"`
	Nullifier frontend.Variable `gnark:",public"`
}

func (c *Aadhaar) Define(api frontend.API) error {
	// 1. Pack CredentialHash into emulated element for RSA
	rsaField, err := emulated.NewField[RSA2048Fp](api)
	if err != nil {
		return err
	}
	hashBits := api.ToBinary(c.CredentialHash, 253)
	rsaMsgHash := rsaField.FromBits(hashBits...)

	// 2. Verify RSA-2048 Signature
	rsaHelper := &ZKRSAHelper{}
	if err := rsaHelper.VerifyRSA(api, &c.Signature, rsaMsgHash); err != nil {
		return err
	}

	// 3. Verify Constraints
	api.AssertIsLessOrEqual(c.MinAge, c.ActualAge)
	api.AssertIsEqual(c.CredentialHash, c.CredentialHashPublic)

	// 4. Generate Nullifier using MiMC on CredentialHash
	h, err := mimc.NewMiMC(api)
	if err != nil {
		return err
	}
	h.Write(c.CredentialHash)
	c.Nullifier = h.Sum()

	// 5. Output
	c.IsValid = api.IsZero(0)

	return nil
}
