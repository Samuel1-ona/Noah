import { OCRExtractor } from './ocr.js';
import { parseTD3, type MRZData } from './mrz.js';

export interface IdentityProfile extends MRZData {
    confidence: number;
}

/**
 * IdentityManager - Orchestrates OCR and MRZ parsing for Noah SDK
 */
export class IdentityManager {
    private ocr: OCRExtractor;

    constructor() {
        this.ocr = new OCRExtractor();
    }

    /**
     * Extract identity profile from a document image
     * @param imageSource - URL, File, or Blob of the document
     * @returns IdentityProfile containing parsed data and OCR confidence
     */
    async extractFromImage(imageSource: string | File | Blob): Promise<IdentityProfile> {
        const ocrResult = await this.ocr.extractMRZ(imageSource);

        if (ocrResult.mrzLines.length < 2) {
            throw new Error(`Failed to detect MRZ lines in image. Raw text: ${ocrResult.rawText.substring(0, 100)}...`);
        }

        // Attempt to parse the detected lines (assuming TD3/Passport for now)
        // TD3 expects two lines of 44 characters
        const mrzData = parseTD3(ocrResult.mrzLines[0], ocrResult.mrzLines[1]);

        return {
            ...mrzData,
            confidence: ocrResult.confidence,
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.ocr.terminate();
    }
}
