package circuit

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/algebra/emulated/sw_emulated"
	"github.com/consensys/gnark/std/math/emulated"
	"github.com/consensys/gnark/std/signature/ecdsa"
)

// P256Params maps to the secp256r1 / P-256 curve used in ICAO e-passports
// and modern national ID cards (Europe, GCC, etc.)
type P256Params = emulated.P256Fp

// ZKECDSA_P256Circuit verifies a P-256 ECDSA signature inside a ZK proof.
// This proves "I know an ECDSA signature on this message without revealing it."
type ZKECDSA_P256Circuit struct {
	// Private inputs
	// Signature components (emulated field elements)
	Sig ecdsa.Signature[emulated.P256Fr] `gnark:"sig"`

	// Public inputs
	// The public key of the signing authority (e.g., a country's Document Signer)
	PublicKey ecdsa.PublicKey[P256Params, emulated.P256Fr] `gnark:",public"`

	// A hash of the signed data (e.g., SHA-256(SOD) from the e-passport)
	MessageHash emulated.Element[emulated.P256Fr] `gnark:",public"`
}

// Define enforces that Sig is a valid ECDSA-P256 signature from PublicKey on MessageHash.
func (c *ZKECDSA_P256Circuit) Define(api frontend.API) error {
	// Verify the ECDSA-P256 signature.
	// gnark's ecdsa.PublicKey.Verify(api, CurveParams, *msgHash, *sig)
	c.PublicKey.Verify(api, sw_emulated.GetP256Params(), &c.MessageHash, &c.Sig)
	return nil
}
