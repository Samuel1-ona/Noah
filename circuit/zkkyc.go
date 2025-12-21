package circuit

import (
	"github.com/consensys/gnark/frontend"
)

// ZKKYC represents the ZK-KYC circuit for selective disclosure
type ZKKYC struct {
	// Private inputs (hidden from verifier)
	ActualAge          frontend.Variable `gnark:"actualAge"`
	ActualJurisdiction frontend.Variable `gnark:"actualJurisdiction"`
	ActualAccredited   frontend.Variable `gnark:"actualAccredited"`
	CredentialHash     frontend.Variable `gnark:"credentialHash"`

	// Public inputs (revealed to verifier)
	MinAge                frontend.Variable   `gnark:",public"`
	AllowedJurisdictions  [10]frontend.Variable `gnark:",public"`
	RequireAccredited     frontend.Variable   `gnark:",public"`
	CredentialHashPublic  frontend.Variable   `gnark:",public"`

	// Output
	IsValid frontend.Variable `gnark:",public"`
}

// Define declares the circuit's constraints
func (circuit *ZKKYC) Define(api frontend.API) error {
	// 1. Age verification: actualAge >= minAge
	// Use Cmp directly: returns 1 if actualAge >= minAge (including equality)
	ageValid := api.Cmp(circuit.ActualAge, circuit.MinAge)

	// 2. Jurisdiction verification: actualJurisdiction in allowedJurisdictions
	jurisdictionValid := circuit.checkJurisdiction(api, circuit.ActualJurisdiction, circuit.AllowedJurisdictions)

	// 3. Credential hash verification
	hashDiff := api.Sub(circuit.CredentialHash, circuit.CredentialHashPublic)
	hashValid := api.IsZero(hashDiff) // 1 if hashes match, 0 otherwise

	// 4. Accreditation check
	accreditationValid := circuit.checkAccreditation(api, circuit.ActualAccredited, circuit.RequireAccredited)

	// All checks must pass (all should be 1)
	// isValid = ageValid * jurisdictionValid * hashValid * accreditationValid
	circuit.IsValid = api.Mul(ageValid, api.Mul(jurisdictionValid, api.Mul(hashValid, accreditationValid)))

	return nil
}

// checkJurisdiction verifies if actualJurisdiction is in the allowed list
// Note: 0 is treated as an empty slot and is ignored
func (circuit *ZKKYC) checkJurisdiction(api frontend.API, actual frontend.Variable, allowed [10]frontend.Variable) frontend.Variable {
	// Check if actual matches any of the allowed jurisdictions (excluding 0)
	matches := make([]frontend.Variable, 10)
	for i := 0; i < 10; i++ {
		// Check if this slot is non-zero (not empty)
		isNonZero := api.Cmp(allowed[i], 0)
		// Check if actual matches this jurisdiction
		diff := api.Sub(actual, allowed[i])
		isMatch := api.IsZero(diff)
		// matches[i] = 1 if (slot is non-zero AND actual matches), else 0
		matches[i] = api.Mul(isNonZero, isMatch)
	}

	// OR gate: at least one match
	// Sum all matches, if sum > 0, at least one is true
	sum := frontend.Variable(0)
	for i := 0; i < 10; i++ {
		sum = api.Add(sum, matches[i])
	}

	// Return 1 if sum > 0, else 0
	// We check if sum > 0 by comparing sum with 0
	sumCmp := api.Cmp(sum, 0)
	return sumCmp // Returns 1 if sum > 0, 0 otherwise
}

// checkAccreditation verifies accreditation status
// Simplified logic: if not required, always valid; if required, must match
func (circuit *ZKKYC) checkAccreditation(api frontend.API, actual frontend.Variable, required frontend.Variable) frontend.Variable {
	// If requireAccredited is 0, always valid (return 1)
	// If requireAccredited is 1, actualAccredited must be 1
	notRequired := api.IsZero(required) // 1 if not required, 0 if required
	
	// Check if actual matches required
	matches := api.IsZero(api.Sub(actual, required)) // 1 if matches, 0 otherwise

	// isValid = (not required) OR (matches)
	// If notRequired = 1, result = 1; else result = matches
	// This is: notRequired OR matches
	// Since notRequired is 0 or 1, and matches is 0 or 1:
	// result = notRequired + matches - (notRequired * matches)
	// But simpler: if notRequired = 1, return 1; else return matches
	one := frontend.Variable(1)
	notRequiredComplement := api.Sub(one, notRequired) // 0 if not required, 1 if required
	requiredAndMatches := api.Mul(notRequiredComplement, matches) // matches only if required
	return api.Add(notRequired, requiredAndMatches) // 1 if not required OR (required and matches)
}

