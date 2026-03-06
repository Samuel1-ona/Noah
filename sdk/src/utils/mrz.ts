export interface MRZData {
    documentType: string;
    issuingState: string;
    lastName: string;
    firstName: string;
    passportNumber: string;
    nationality: string;
    dateOfBirth: Date;
    gender: string;
    expiryDate: Date;
    personalNumber: string;
    age: number;
}

export function validateCheckDigit(str: string, checkDigit: string): boolean {
    const weights = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        let value = 0;
        if (char === '<') {
            value = 0;
        } else if (/[0-9]/.test(char)) {
            value = parseInt(char);
        } else if (/[A-Z]/.test(char)) {
            value = char.charCodeAt(0) - 65 + 10;
        }
        sum += value * weights[i % 3];
    }
    return (sum % 10) === parseInt(checkDigit);
}

function parseDate(str: string, isDOB: boolean = false): Date {
    const yearStr = str.substring(0, 2);
    const month = parseInt(str.substring(2, 4)) - 1;
    const day = parseInt(str.substring(4, 6));

    let year = parseInt(yearStr);
    const currentYear = new Date().getFullYear() % 100;

    if (isDOB) {
        if (year > currentYear) {
            year += 1900;
        } else {
            year += 2000;
        }
    } else {
        // For expiry date, assume 20xx
        year += 2000;
    }

    return new Date(year, month, day);
}

function tryCorrect(str: string, checkDigit: string, isNumericOnly: boolean = false): string | null {
    if (validateCheckDigit(str, checkDigit)) return str;

    const substitutions: Record<string, string[]> = {
        '8': ['B'], 'B': ['8'],
        '0': ['O', 'Q', 'D'], 'O': ['0'], 'Q': ['0'], 'D': ['0'],
        'I': ['1'], '1': ['I'],
        'Z': ['2'], '2': ['Z'],
        'S': ['5'], '5': ['S']
    };

    // Try substituting one character at a time in the string
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (substitutions[char]) {
            for (const sub of substitutions[char]) {
                const candidate = str.substring(0, i) + sub + str.substring(i + 1);
                if (validateCheckDigit(candidate, checkDigit)) {
                    if (isNumericOnly && /[A-Z]/.test(candidate)) continue;
                    return candidate;
                }
            }
        }
    }

    // Checking if the check digit itself was read wrong
    if (substitutions[checkDigit]) {
        for (const sub of substitutions[checkDigit]) {
            if (/[0-9]/.test(sub) && validateCheckDigit(str, sub)) {
                return str;
            }
        }
    }

    // Try normalising everything to numbers if strictly numeric
    if (isNumericOnly) {
        let numericCandidate = "";
        for (let i = 0; i < str.length; i++) {
            let c = str[i];
            if (c === 'O' || c === 'D' || c === 'Q') c = '0';
            else if (c === 'I') c = '1';
            else if (c === 'Z') c = '2';
            else if (c === 'S') c = '5';
            else if (c === 'B') c = '8';
            numericCandidate += c;
        }
        if (validateCheckDigit(numericCandidate, checkDigit) && !/[A-Z]/.test(numericCandidate)) {
            return numericCandidate;
        }
    }

    return null;
}

export function parseTD3(line1: string, line2: string): MRZData {
    // Pad dropped chevrons if length is short (OCR filter ensures it's at least ~34 chars)
    if (line1.length < 44) {
        line1 = line1.padEnd(44, '<');
    }
    if (line2.length < 44) {
        line2 = line2.padEnd(44, '<');
    }

    // Truncate slightly long lines
    if (line1.length > 44) line1 = line1.substring(0, 44);
    if (line2.length > 44) line2 = line2.substring(0, 44);

    if (line1.length !== 44 || line2.length !== 44) {
        throw new Error(`Invalid TD3 MRZ length. Line1: ${line1.length}, Line2: ${line2.length}`);
    }

    const documentType = line1.substring(0, 2).replace(/</g, '');
    const issuingState = line1.substring(2, 5).replace(/</g, '');

    const namesPart = line1.substring(5);
    const [lastNamePart, firstNamePart] = namesPart.split('<<');
    const lastName = lastNamePart.replace(/</g, ' ').trim();
    const firstName = (firstNamePart || '').replace(/</g, ' ').trim();

    let passportNumber = line2.substring(0, 9);
    const passportCheck = line2.substring(9, 10);
    const correctedPassport = tryCorrect(passportNumber, passportCheck);
    if (!correctedPassport) {
        console.warn(`Invalid passport number check digit for ${passportNumber}. Proceeding anyway (likely a dummy/stock image).`);
        passportNumber = passportNumber.replace(/</g, '');
    } else {
        passportNumber = correctedPassport.replace(/</g, '');
    }

    const nationality = line2.substring(10, 13).replace(/</g, '');
    let dobStr = line2.substring(13, 19);
    const dobCheck = line2.substring(19, 20);
    const correctedDob = tryCorrect(dobStr, dobCheck, true);
    if (!correctedDob) {
        console.warn(`Invalid date of birth check digit for ${dobStr}. Proceeding anyway.`);
    } else {
        dobStr = correctedDob;
    }
    const dateOfBirth = parseDate(dobStr, true);

    const gender = line2.substring(20, 21);
    let expiryStr = line2.substring(21, 27);
    const expiryCheck = line2.substring(27, 28);
    const correctedExpiry = tryCorrect(expiryStr, expiryCheck, true);
    if (!correctedExpiry) {
        console.warn(`Invalid expiry date check digit for ${expiryStr}. Proceeding anyway.`);
    } else {
        expiryStr = correctedExpiry;
    }
    const expiryDate = parseDate(expiryStr, false);

    const personalNumber = line2.substring(28, 42).replace(/</g, '');

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }

    return {
        documentType,
        issuingState,
        lastName,
        firstName,
        passportNumber,
        nationality,
        dateOfBirth,
        gender,
        expiryDate,
        personalNumber,
        age,
    };
}
