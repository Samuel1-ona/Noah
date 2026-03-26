import { createWorker, type Worker } from 'tesseract.js';

export interface OCROutput {
    rawText: string;
    mrzLines: string[];
    confidence: number;
}

export class OCRExtractor {
    private worker: Worker | null = null;
    private initialized: boolean = false;

    async initialize() {
        if (this.initialized) return;
        this.worker = await createWorker('eng');
        this.initialized = true;
    }

    async extractMRZ(imageSource: string | File | Blob): Promise<OCROutput> {
        await this.initialize();
        if (!this.worker) throw new Error('OCR Worker not initialized');

        // Whitelist all alphanumeric characters and MRZ filler
        await this.worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        });

        const { data: { text, confidence } } = await this.worker.recognize(imageSource);
        
        // Return raw text directly. Formatting and correction is handled by ICAOParser.
        return { rawText: text, mrzLines: [], confidence };
    }

    async extractDualMRZ(frontImage: string | File | Blob, backImage: string | File | Blob): Promise<OCROutput> {
        const frontResult = await this.extractMRZ(frontImage);
        const backResult = await this.extractMRZ(backImage);
        return {
            rawText: frontResult.rawText + '\n' + backResult.rawText,
            mrzLines: [],
            confidence: (frontResult.confidence + backResult.confidence) / 2
        };
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.initialized = false;
        }
    }
}
