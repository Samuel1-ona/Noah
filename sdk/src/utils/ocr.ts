import { createWorker, type Worker } from 'tesseract.js';

export interface OCROutput {
    rawText: string;
    mrzLines: string[];
    confidence: number;
}

/**
 * OCR Extractor for processing identity documents in the browser
 */
export class OCRExtractor {
    private worker: Worker | null = null;
    private initialized: boolean = false;

    /**
     * Initialize the Tesseract worker
     */
    async initialize() {
        if (this.initialized) return;

        this.worker = await createWorker('eng'); // MRZ is always Latin characters
        this.initialized = true;
    }

    /**
     * Extract MRZ data from an image
     * @param imageSource - URL, File, or Blob of the document image
     * @returns Extracted text and MRZ lines
     */
    async extractMRZ(imageSource: string | File | Blob): Promise<OCROutput> {
        await this.initialize();

        if (!this.worker) {
            throw new Error('OCR Worker not initialized');
        }

        // Set parameters to optimize for MRZ
        // MRZ uses a specific OCR-B font, but standard 'eng' is usually sufficient
        // We can restrict characters to A-Z, 0-9, and '<'
        await this.worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        });

        const { data: { text, confidence } } = await this.worker.recognize(imageSource);

        const mrzLines = this.filterMRZLines(text);

        return {
            rawText: text,
            mrzLines,
            confidence,
        };
    }

    /**
     * Filter and clean MRZ lines from raw OCR text
     */
    private filterMRZLines(text: string): string[] {
        const lines = text.split('\n').map(l => l.trim().replace(/\s/g, ''));

        // TD3 MRZ (Passport) is 2 lines of 44 characters
        // TD1 (ID Card) is 3 lines of 30 characters
        // We look for lines containing multiple '<' characters
        return lines.filter(line => {
            const charCount = line.length;
            const chevronCount = (line.match(/</g) || []).length;

            // Heuristic: MRZ lines are long and have many chevrons
            return (charCount >= 30 && chevronCount >= 2);
        });
    }

    /**
     * Terminate the worker to free resources
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.initialized = false;
        }
    }
}
