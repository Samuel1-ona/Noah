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
  dob: string; // Formatted as "DD Mon YYYY"
  expiry: string; // Formatted as "DD Mon YYYY"
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
    // Step 1: Strip everything except valid MRZ characters (A-Z, 0-9, <)
    const cleanMRZ = mrz.replace(/[^A-Z0-9<]/gi, '').toUpperCase();

    // Step 2: Try exact lengths first (ideal scenario — clean scan)
    if (cleanMRZ.length === 90) return this.parseTD1(this.correctTD1(cleanMRZ));
    if (cleanMRZ.length === 72) return this.parseTD2(cleanMRZ);
    if (cleanMRZ.length === 88) return this.parseTD3(cleanMRZ);

    // Step 3: Sliding window — find the valid MRZ block within the OCR noise.
    //
    // Guards to avoid false positives on card header/footer text:
    //   - TD1 (ID Card): MUST start with 'I' (all ID cards begin with "ID", "IP", "I<" etc.)
    //     We do NOT include C, M, A since those match words like CALLNIMC, MASTERCARD, AUTHORISED
    //   - TD3 (Passport):  MUST start with 'P' 
    //   - Minimum 15 '<' filler chars required — real MRZ blocks are heavily padded with '<'
    //     but arbitrary card text has almost none.

    const countChevrons = (s: string) => (s.match(/</g) || []).length;

    // TD1 (National ID / Driver's License) — 90 chars, starts with 'I'
    // Tesseract often mis-reads the border of the ID and inserts an extra character at the end of a line.
    // Given the raw text has newlines, we can safely find our blocks by splitting by newline and filtering.
    const rawLines = mrz.split('\n').map(l => l.replace(/[^A-Z0-9<]/gi, '').toUpperCase());
    const validLines = rawLines.filter(l => l.length >= 28 && (l.match(/</g) || []).length >= 2);

    if (validLines.length >= 3) {
      // Find the first line that looks like an ID header
      const L1Idx = validLines.findIndex(l => l.startsWith('I'));
      if (L1Idx !== -1 && L1Idx + 2 < validLines.length) {
        // Build a perfectly aligned 90 character string
        const L1 = validLines[L1Idx].substring(0, 30).padEnd(30, '<');
        
        // For line 2, extra characters usually appear at the start ("TEBOLO" instead of "780"). Right-anchor it:
        const L2Raw = validLines[L1Idx + 1];
        const L2 = L2Raw.length > 30 ? L2Raw.slice(-30) : L2Raw.padEnd(30, '<');
        
        const L3 = validLines[L1Idx + 2].substring(0, 30).padEnd(30, '<');
        
        const aligned = L1 + L2 + L3;
        console.log('[Noah SDK] Aligned MRZ (90 chars):', aligned);

        return this.parseTD1(this.correctTD1(aligned));
      }
    }

    // Fallback: sliding window search (for when newlines are completely stripped)
    for (let i = 0; i <= cleanMRZ.length - 90; i++) {
      const candidate = cleanMRZ.substring(i, i + 90);
      if (candidate[0] === 'I' && countChevrons(candidate) >= 15) {
        return this.parseTD1(this.correctTD1(candidate));
      }
    }

    // TD3 (Passport) — 88 chars, starts with 'P'
    for (let i = 0; i <= cleanMRZ.length - 88; i++) {
      const candidate = cleanMRZ.substring(i, i + 88);
      if (candidate[0] === 'P' && countChevrons(candidate) >= 10) {
        return this.parseTD3(candidate);
      }
    }

    // TD2 (rare ID format) — 72 chars, starts with 'I'
    for (let i = 0; i <= cleanMRZ.length - 72; i++) {
      const candidate = cleanMRZ.substring(i, i + 72);
      if (candidate[0] === 'I' && countChevrons(candidate) >= 8) {
        return this.parseTD2(candidate);
      }
    }

    throw new Error(
      `Could not find a valid MRZ block in the scanned image. ` +
      `Please ensure the document is flat, well-lit, and the MRZ zone is clearly visible.`
    );
  }

  /**
   * Apply per-position OCR corrections to a TD1 (90-char) MRZ string.
   * ICAO 9303 defines strict alpha/digit zones — we fix common Tesseract misreads.
   *
   * TD1 layout:
   *   Line 1 (0-29):  [0-1]=docType(alpha), [2-4]=issuer(alpha), [5-13]=docNum(alphanum), [14]=check(digit), [15-29]=optional
   *   Line 2 (30-59): [30-35]=DOB(digit), [36]=check(digit), [37]=gender(alpha), [38-43]=expiry(digit), [44]=check(digit), [45-47]=nationality(alpha), [48-58]=optional, [59]=composite(digit)
   *   Line 3 (60-89): names (alpha + <)
   */
  private static correctTD1(mrz: string): string {
    const a2d: Record<string, string> = {
      'O':'0', 'I':'1', 'L':'1', 'Z':'2', 'S':'5', 'B':'8', 'G':'6', 'A':'4', 'E':'8', 'T':'7', 'Q':'0', 'D':'0'
    };
    const d2a: Record<string, string> = {
      '0':'O', '1':'I', '5':'S', '8':'B', '6':'G', '4':'A', '9':'N'
    };

    const numericPos = new Set([
      14,
      30,31,32,33,34,35, 36,
      38,39,40,41,42,43, 44,
      59,
    ]);
    const alphaPos = new Set([0,1,2,3,4, 37, 45,46,47]);

    // Positions that are optional/filler areas — Tesseract confuses '<' with 'K' or 'L' here.
    const fillerPos = new Set([
      15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,  // Line 1 optional
      48,49,50,51,52,53,54,55,56,57,58,               // Line 2 optional
    ]);

    return mrz.split('').map((c, i) => {
      if (fillerPos.has(i) && (c === 'K' || c === 'L')) return '<';
      if (numericPos.has(i) && /[A-Z]/.test(c)) return a2d[c] ?? c;
      if (alphaPos.has(i) && /[0-9]/.test(c)) return d2a[c] ?? c;
      return c;
    }).join('');
  }

  /** Format YYMMDD → "DD Mon YYYY" */
  static formatDate(yymmdd: string): string {
    if (!yymmdd || yymmdd.length !== 6) return yymmdd;
    const yy = parseInt(yymmdd.substring(0, 2), 10);
    const mm = parseInt(yymmdd.substring(2, 4), 10);
    const dd = parseInt(yymmdd.substring(4, 6), 10);
    // Pivot: 00-30 → 2000s, 31-99 → 1900s
    const year = yy <= 30 ? 2000 + yy : 1900 + yy;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[mm - 1] ?? '???';
    return `${String(dd).padStart(2, '0')} ${monthName} ${year}`;
  }

  /** Strip < filler and K/L (common Tesseract misreads of the filler char) from a field value */
  private static clean(val: string): string {
    return val.replace(/[<KL]/g, '').trim();
  }

  private static parseName(nameString: string): { surname: string; firstName: string } {
    // Tesseract often reads '<' as 'K' — normalise K to < in names before parsing.
    const normalised = nameString.replace(/K/g, '<').replace(/L(?=[<L]|$)/g, '<');
    const parts = normalised.split('<<');
    const surname = parts[0]?.replace(/</g, ' ').trim() ?? '';
    const firstName = parts.slice(1).join(' ').replace(/</g, ' ').trim() ?? '';
    return { surname, firstName };
  }


  private static parseTD1(mrz: string): MRZResult {
    // Line 1 (0-29):  doc type (0-1), issuer (2-4), doc no (5-13), check (14), optional1 (15-29)
    // Line 2 (30-59): dob (30-35), check (36), gender (37), expiry (38-43), check (44), nationality (45-47), optional2 (48-58), composite check (59)
    // Line 3 (60-89): names
    const names = this.parseName(mrz.substring(60, 90));
    let rawDocNum = mrz.substring(5, 14);
    let optional1Start = 15;

    // Specific Nigerian NIN correction: Tesseract often misreads the document number 
    // area by inserting a noise character (usually 'Z') after the leading 'A'.
    // If we see 'IDNGA' and the doc num starts with 'AZ', we reverse the shift.
    if (mrz.startsWith('IDNGA') && rawDocNum.startsWith('AZ')) {
        // Recover: take 'A' from pos 5, skipped index 6 ('Z'), take 8 digits from 7-14.
        rawDocNum = 'A' + mrz.substring(7, 15);
        optional1Start = 15; // stays the same, or maybe 16? 
        // In the OCR "IDNGAAZ221697539", the '9' is at index 15. 
        // So optional1 still starts at 15.
    }

    const optional1 = mrz.substring(optional1Start, 30);
    const cleanOptional1 = this.clean(optional1);
    const fullDocNumber = cleanOptional1
      ? `${this.clean(rawDocNum)}${cleanOptional1}`
      : this.clean(rawDocNum);

    // Nationality is at positions 45-47. Often OCR inserts extra characters (shifts).
    const issuerHint = mrz.substring(2, 5);
    const searchZone = mrz.substring(44, 52); // search slightly before and after
    let nationality = mrz.substring(45, 48);

    if (searchZone.includes(issuerHint)) {
      nationality = issuerHint;
    } else {
      const match = searchZone.match(/[A-Z]{3}/);
      if (match) nationality = match[0];
    }
    
    // Final cleanup of any OCR noise
    nationality = nationality.replace(/[^A-Z]/g, '').substring(0, 3).padEnd(3, '<');

    return {
      documentType: DocumentType.TD1,
      issuer: issuerHint,
      documentNumber: fullDocNumber,
      dob: this.formatDate(mrz.substring(30, 36)),
      gender: mrz.substring(37, 38),
      expiry: this.formatDate(mrz.substring(38, 44)),
      nationality,
      surname: names.surname,
      firstName: names.firstName,
    };
  }

  private static parseTD2(mrz: string): MRZResult {
    const names = this.parseName(mrz.substring(5, 36));
    return {
      documentType: DocumentType.TD2,
      issuer: mrz.substring(2, 5),
      documentNumber: this.clean(mrz.substring(36, 45)),
      dob: this.formatDate(mrz.substring(49, 55)),
      gender: mrz.substring(56, 57),
      expiry: this.formatDate(mrz.substring(57, 63)),
      nationality: mrz.substring(64, 67),
      surname: names.surname,
      firstName: names.firstName,
    };
  }

  private static parseTD3(mrz: string): MRZResult {
    const names = this.parseName(mrz.substring(5, 44));
    return {
      documentType: DocumentType.TD3,
      issuer: mrz.substring(2, 5),
      documentNumber: this.clean(mrz.substring(44, 53)),
      dob: this.formatDate(mrz.substring(57, 63)),
      gender: mrz.substring(64, 65),
      expiry: this.formatDate(mrz.substring(65, 71)),
      nationality: mrz.substring(54, 57),
      surname: names.surname,
      firstName: names.firstName,
    };
  }
}
