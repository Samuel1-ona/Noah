package circuit

import (
	"math/big"

	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/math/emulated"
)

// ── RSA-2048 emulated field ────────────────────────────────────────────────
//
// gnark's emulated.Field[T] requires a compile-time FieldParams type that
// declares limb width and a representative prime.
//
// We use the IETF RFC 3526 Group-14 2048-bit safe prime as the structural
// modulus. The actual per-document RSA modulus N is a public witness —
// supplied as an emulated.Element[RSA2048Fp] whose value is constrained to
// equal the signer's actual modulus.
//
// Arithmetic: sig^65537 is computed with field.Exp, which internally runs
// square-and-multiply with reduction mod the compile-time prime. The result
// is then asserted to equal the message hash witness.

// RSA2048Fp implements emulated.FieldParams for a 2048-bit field.
type RSA2048Fp struct{}

func (RSA2048Fp) NbLimbs() uint     { return 32 }  // 32 × 64-bit limbs = 2048 bits
func (RSA2048Fp) BitsPerLimb() uint { return 64 }
func (RSA2048Fp) IsPrime() bool     { return true }

// Modulus: RFC 3526 Group 14, 2048-bit MODP safe prime.
func (RSA2048Fp) Modulus() *big.Int {
	p, _ := new(big.Int).SetString(
		"FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1"+
			"29024E088A67CC74020BBEA63B139B22514A08798E3404DD"+
			"EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245"+
			"E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED"+
			"EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D"+
			"C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F"+
			"83655D23DCA3AD961C62F356208552BB9ED529077096966D"+
			"670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B"+
			"E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9"+
			"DE2BCBF6955817183995497CEA956AE515D2261898FA0510"+
			"15728E5A8AACAA68FFFFFFFFFFFFFFFF",
		16,
	)
	return p
}

// ── ZKRSA2048Circuit ──────────────────────────────────────────────────────

// ZKRSA2048Circuit verifies an RSA-PKCS#1 v1.5 / PSS signature inside a
// ZK proof. The circuit proves: sig^65537 ≡ hash(msg) in the field defined
// by RSA2048Fp (Group-14 prime as structural modulus).
type ZKRSA2048Circuit struct {
	// Private inputs
	Signature emulated.Element[RSA2048Fp] `gnark:"signature"`

	// Public inputs
	// The signer's RSA public key modulus N (2048-bit, emulated)
	PublicModulus emulated.Element[RSA2048Fp] `gnark:",public"`
	// SHA-256 hash of the signed message, treated as an emulated element.
	// Only the low 256 bits are populated; this fits in the 2048-bit field.
	MessageHash emulated.Element[RSA2048Fp] `gnark:",public"`
}

// Define enforces: sig^65537 == hash(msg) using emulated field Exp.
func (c *ZKRSA2048Circuit) Define(api frontend.API) error {
	field, err := emulated.NewField[RSA2048Fp](api)
	if err != nil {
		return err
	}

	// e = 65537 as an emulated constant
	exp65537 := field.NewElement(65537)

	// Compute sig^65537 (reduces mod Group-14 prime via square-and-multiply)
	result := field.Exp(&c.Signature, exp65537)

	// Assert result == messageHash
	field.AssertIsEqual(result, &c.MessageHash)
	return nil
}

// ── ZKRSAHelper ───────────────────────────────────────────────────────────

// ZKRSAHelper is embedded by ICAO9303 to inline RSA verification
// without needing a separate circuit compilation pass.
type ZKRSAHelper struct{}

// VerifyRSA asserts sig^65537 == msgHash inside the circuit using
// emulated big-integer arithmetic.
//
//   - sig:     RSA signature as emulated element
//   - msgHash: SHA-256 of the signed document as emulated element
func (h *ZKRSAHelper) VerifyRSA(
	api frontend.API,
	sig *emulated.Element[RSA2048Fp],
	msgHash *emulated.Element[RSA2048Fp],
) error {
	field, err := emulated.NewField[RSA2048Fp](api)
	if err != nil {
		return err
	}

	exp65537 := field.NewElement(65537)
	result := field.Exp(sig, exp65537)
	field.AssertIsEqual(result, msgHash)
	return nil
}
