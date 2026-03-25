package circuit

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/hash/mimc"
)

// NIMCNigeria represents the ZK circuit for Nigerian National ID verification
type NIMCNigeria struct {
	// Private inputs
	NIN            frontend.Variable `gnark:"nin"` // National Identification Number
	ActualAge      frontend.Variable `gnark:"actualAge"`
	CredentialHash frontend.Variable `gnark:"credentialHash"`

	// Public inputs
	MinAge               frontend.Variable     `gnark:",public"`
	RecipientAddress     frontend.Variable     `gnark:",public"`
	CredentialHashPublic frontend.Variable     `gnark:",public"`

	// Outputs
	IsValid   frontend.Variable `gnark:",public"`
	Nullifier frontend.Variable `gnark:",public"` // Hash(NIN)
}

func (c *NIMCNigeria) Define(api frontend.API) error {
	// 1. Verify Age
	api.AssertIsLessOrEqual(c.MinAge, c.ActualAge)

	// 2. Verify CredentialHash connects to Public binding
	api.AssertIsEqual(c.CredentialHash, c.CredentialHashPublic)

	// 3. Generate Nullifier from NIN
	h, err := mimc.NewMiMC(api)
	if err != nil {
		return err
	}
	h.Write(c.NIN)
	c.Nullifier = h.Sum()

	// 4. Output Validity
	c.IsValid = api.IsZero(0)

	return nil
}
