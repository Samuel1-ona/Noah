/**
 * ICAO 9303 MRZ Parser
 * Supports TD1 (3x30), TD2 (2x36), and TD3 (2x44)
 */

export enum DocumentType {
  TD1 = 1, // Identity Card (3 lines, 30 chars)
  TD2 = 2, // Identity Card (2 lines, 36 chars)
  TD3 = 3, // Passport (2 lines, 44 chars)
}

export interface MRZResult {
  documentType: DocumentType;
  issuer: string;
  documentNumber: string;
  dob: string; // YYMMDD
  expiry: string; // YYMMDD
  gender: string;
  nationality: string;
  surname: string;
  firstName: string;
}

export class ICAOParser {
  /**
   * Parse a raw MRZ string (newlines removed)
   */
  static parse(mrz: string): MRZResult {
    const cleanMRZ = mrz.replace(/\s/g, '').toUpperCase();
    
    if (cleanMRZ.length === 90) return this.parseTD1(cleanMRZ);
    if (cleanMRZ.length === 72) return this.parseTD2(cleanMRZ);
    if (cleanMRZ.length === 88) return this.parseTD3(cleanMRZ);
    
    throw new Error('Invalid MRZ length: ' + cleanMRZ.length);
  }

  private static parseTD1(mrz: string): MRZResult {
    // Line 1: 0-30
    // Line 2: 30-60
    // Line 3: 60-90
    return {
      documentType: DocumentType.TD1,
      issuer: mrz.substring(2, 5),
      documentNumber: mrz.substring(5, 14),
      dob: mrz.substring(30, 36),
      gender: mrz.substring(37, 38),
      expiry: mrz.substring(38, 44),
      nationality: mrz.substring(45, 48),
      surname: '', // Complex to parse TD1 names
      firstName: '',
    };
  }

  private static parseTD2(mrz: string): MRZResult {
    return {
      documentType: DocumentType.TD2,
      issuer: mrz.substring(2, 5),
      documentNumber: mrz.substring(36, 45),
      dob: mrz.substring(49, 55),
      gender: mrz.substring(56, 57),
      expiry: mrz.substring(57, 63),
      nationality: mrz.substring(64, 67),
      surname: '',
      firstName: '',
    };
  }

  private static parseTD3(mrz: string): MRZResult {
    return {
      documentType: DocumentType.TD3,
      issuer: mrz.substring(2, 5),
      documentNumber: mrz.substring(44, 53),
      dob: mrz.substring(57, 63),
      gender: mrz.substring(64, 65),
      expiry: mrz.substring(65, 71),
      nationality: mrz.substring(54, 57),
      surname: '',
      firstName: '',
    };
  }
}
