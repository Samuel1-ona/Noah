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

export function parseTD3(line1: string, line2: string): MRZData {
    if (line1.length !== 44 || line2.length !== 44) {
        throw new Error('Invalid TD3 MRZ length');
    }

    const documentType = line1.substring(0, 2).replace(/</g, '');
    const issuingState = line1.substring(2, 5).replace(/</g, '');

    const namesPart = line1.substring(5);
    const [lastNamePart, firstNamePart] = namesPart.split('<<');
    const lastName = lastNamePart.replace(/</g, ' ').trim();
    const firstName = (firstNamePart || '').replace(/</g, ' ').trim();

    const passportNumber = line2.substring(0, 9).replace(/</g, '');
    const passportCheck = line2.substring(9, 10);
    if (!validateCheckDigit(line2.substring(0, 9), passportCheck)) {
        throw new Error('Invalid passport number check digit');
    }

    const nationality = line2.substring(10, 13).replace(/</g, '');
    const dobStr = line2.substring(13, 19);
    const dobCheck = line2.substring(19, 20);
    if (!validateCheckDigit(dobStr, dobCheck)) {
        throw new Error('Invalid date of birth check digit');
    }
    const dateOfBirth = parseDate(dobStr, true);

    const gender = line2.substring(20, 21);
    const expiryStr = line2.substring(21, 27);
    const expiryCheck = line2.substring(27, 28);
    if (!validateCheckDigit(expiryStr, expiryCheck)) {
        throw new Error('Invalid expiry date check digit');
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
