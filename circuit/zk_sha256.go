package circuit

import (
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/std/hash/sha2"
	"github.com/consensys/gnark/std/math/uints"
)

// SHA256Gadget wraps gnark's SHA-256 for use inside other circuits.
// Call Hash(api, data) to get a 32-byte digest as 32 uints.U8 values.
func SHA256(api frontend.API, data []uints.U8) ([]uints.U8, error) {
	uapi, err := uints.New[uints.U32](api)
	if err != nil {
		return nil, err
	}

	h, err := sha2.New(api)
	if err != nil {
		return nil, err
	}

	h.Write(data)
	digest := h.Sum()

	_ = uapi // uapi used for future byte-level assertions
	return digest, nil
}

// SHA256Circuit demonstrates standalone SHA-256 verification.
// Use this for testing the hash gadget in isolation.
type SHA256Circuit struct {
	// Private: The pre-image we want to hash
	Preimage [93]uints.U8 // TD3 MRZ max length

	// Public: The expected hash output (32 bytes)
	ExpectedDigest [32]uints.U8 `gnark:",public"`
}

func (c *SHA256Circuit) Define(api frontend.API) error {
	digest, err := SHA256(api, c.Preimage[:])
	if err != nil {
		return err
	}

	uapi, err := uints.New[uints.U32](api)
	if err != nil {
		return err
	}

	// Assert each byte of the computed digest matches the expected
	for i := 0; i < 32; i++ {
		uapi.ByteAssertEq(digest[i], c.ExpectedDigest[i])
	}

	return nil
}
