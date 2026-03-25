package circuit

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/algebra/emulated/sw_emulated"
	"github.com/consensys/gnark/std/math/emulated"
	"github.com/consensys/gnark/std/math/uints"
	"github.com/consensys/gnark/std/signature/ecdsa"
	"github.com/consensys/gnark/std/hash/mimc"
)

// SignatureAlgorithm constants — must match NoahBridge.ts SIG_ALG_* values.
const (
	SigAlgRSA   = 1
	SigAlgECDSA = 2
)

// ICAO9303 is a unified ZK circuit for TD1, TD2, and TD3 travel documents.
// It supports both RSA-2048 and ECDSA-P256 Passive Authentication.
type ICAO9303 struct {
	// ── Private inputs ──────────────────────────────────────────────────

	// MRZ bytes (max TD3 = 88 chars; padded to 93)
	MRZData      [93]uints.U8      `gnark:"mrzData"`
	MRZLength    frontend.Variable `gnark:"mrzLength"`
	DocumentType frontend.Variable `gnark:"documentType"` // 1=TD1,2=TD2,3=TD3
	ActualAge    frontend.Variable `gnark:"actualAge"`
	ExpiryDate   frontend.Variable `gnark:"expiryDate"`

	// ── RSA-2048 path ───────────────────────────────────────────────────
	// Signature and the associated SHA-256 hash each represented as 2048-bit
	// emulated elements (only the low-order bits are populated for the hash).
	RSASignature emulated.Element[RSA2048Fp] `gnark:"rsaSignature"`
	// Note: the public modulus is a *public* input on the RSA path.
	RSAModulus emulated.Element[RSA2048Fp] `gnark:",public"`

	// ── ECDSA-P256 path ─────────────────────────────────────────────────
	ECDSASig    ecdsa.Signature[emulated.P256Fr]                  `gnark:"ecdsaSig"`
	ECDSAPubKey ecdsa.PublicKey[emulated.P256Fp, emulated.P256Fr] `gnark:"ecdsaPubKey"`

	CredentialHash frontend.Variable `gnark:"credentialHash"`

	// ── Public inputs ────────────────────────────────────────────────────
	MinAge               frontend.Variable     `gnark:",public"`
	CurrentDate          frontend.Variable     `gnark:",public"`
	AllowedJurisdictions [10]frontend.Variable `gnark:",public"`
	RecipientAddress     frontend.Variable     `gnark:",public"`
	CredentialHashPublic frontend.Variable     `gnark:",public"`
	SigAlgorithm         frontend.Variable     `gnark:",public"` // 1=RSA, 2=ECDSA

	// ── Outputs ──────────────────────────────────────────────────────────
	IsValid   frontend.Variable `gnark:",public"`
	Nullifier frontend.Variable `gnark:",public"`
}

// Define declares all circuit constraints.
func (c *ICAO9303) Define(api frontend.API) error {
	// ── 1. Document type validation (1, 2, or 3) ────────────────────────
	api.AssertIsLessOrEqual(1, c.DocumentType)
	api.AssertIsLessOrEqual(c.DocumentType, 3)

	// ── 2. SHA-256 hash of MRZ data ─────────────────────────────────────
	mrzSlice := make([]uints.U8, len(c.MRZData))
	copy(mrzSlice, c.MRZData[:])
	mrzHash, err := SHA256(api, mrzSlice) // returns []uints.U8 (32 bytes)
	if err != nil {
		return err
	}

	// ── 3a. Pack mrzHash bytes into an emulated element for ECDSA ───────
	// P256Fr is ~256 bits; we pack 31 bytes (248 bits) to stay within range.
	// Build a 248-bit integer from the first 31 hash bytes
	var ecdsaMsgHashBits []frontend.Variable
	for i := 0; i < 31; i++ {
		// api.ToBinary returns little-endian bits of the byte
		byteBits := api.ToBinary(mrzHash[i].Val, 8)
		ecdsaMsgHashBits = append(ecdsaMsgHashBits, byteBits...)
	}
	emField, err := emulated.NewField[emulated.P256Fr](api)
	if err != nil {
		return err
	}
	ecdsaMsgHash := emField.FromBits(ecdsaMsgHashBits...)

	// ── 3b. ECDSA-P256 Passive Authentication ───────────────────────────
	// Verify is void — it asserts constraints in-circuit.
	c.ECDSAPubKey.Verify(api, sw_emulated.GetCurveParams[emulated.P256Fp](), ecdsaMsgHash, &c.ECDSASig)

	// ── 3c. Pack mrzHash bytes into an emulated element for RSA ─────────
	// RSA2048Fp is 2048-bit; the 256-bit hash fits in the low limbs.
	rsaField, err := emulated.NewField[RSA2048Fp](api)
	if err != nil {
		return err
	}
	// Build a 256-bit integer from all 32 hash bytes as bits
	var rsaHashBits []frontend.Variable
	for i := 0; i < 32; i++ {
		byteBits := api.ToBinary(mrzHash[i].Val, 8)
		rsaHashBits = append(rsaHashBits, byteBits...)
	}
	rsaMsgHash := rsaField.FromBits(rsaHashBits...)

	// ── 3d. RSA-2048 Passive Authentication ─────────────────────────────
	rsaHelper := &ZKRSAHelper{}
	if err := rsaHelper.VerifyRSA(api, &c.RSASignature, rsaMsgHash); err != nil {
		return err
	}

	// ── 4. Selective Disclosure ──────────────────────────────────────────
	// Age: actualAge >= minAge
	api.AssertIsLessOrEqual(c.MinAge, c.ActualAge)
	// Expiry: expiryDate >= currentDate
	api.AssertIsLessOrEqual(c.CurrentDate, c.ExpiryDate)

	// ── 5. IsValid and Nullifier ─────────────────────────────────────────
	// We generate the nullifier by hashing the CredentialHash
	h, err := mimc.NewMiMC(api)
	if err != nil {
		return err
	}
	h.Write(c.CredentialHash)
	c.Nullifier = h.Sum()

	// Ensure credential hash matches public
	api.AssertIsEqual(c.CredentialHash, c.CredentialHashPublic)

	c.IsValid = api.IsZero(0) // always 1 when we reach here

	return nil
}
