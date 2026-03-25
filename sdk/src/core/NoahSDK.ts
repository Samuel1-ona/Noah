import { ContractClient } from './ContractClient.js';
import { APIClient, type APIClientConfig } from './APIClient.js';
import { ICAOParser, type MRZResult } from '../utils/icao.js';
import { OCRExtractor } from '../utils/ocr.js';
import type {
    ContractClientConfig,
    Proof,
    TransactionResult,
    Requirements
} from '../utils/types.js';
import type { Signer } from 'ethers';

export class NoahError extends Error {
    constructor(public message: string, public code: string) {
        super(message);
        this.name = 'NoahError';
    }
}

export class NoahValidationError extends NoahError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
    }
}

export class NoahProverError extends NoahError {
    constructor(message: string) {
        super(message, 'PROVER_ERROR');
    }
}

export class NoahSDK {
    public contracts: ContractClient;
    public api: APIClient;
    private ocrExtractor: OCRExtractor;

    constructor(config?: ContractClientConfig & APIClientConfig) {
        this.contracts = new ContractClient(config);
        this.api = new APIClient(config);
        this.ocrExtractor = new OCRExtractor();
    }

    /**
     * Extract identity data from any ICAO 9303 document (Passport, ID Card)
     */
    public async extractICAOData(image: File | string | Blob): Promise<MRZResult> {
        const { mrzLines } = await this.ocrExtractor.extractMRZ(image);

        if (mrzLines.length < 2) {
            throw new NoahValidationError('Could not detect MRZ lines in the image.');
        }

        const fullMRZ = mrzLines.join('');

        try {
            return ICAOParser.parse(fullMRZ);
        } catch (error) {
            throw new NoahValidationError(`Failed to parse MRZ: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Alias for extractICAOData used by frontend demos
     */
    public async extractPassportData(image: File | string | Blob): Promise<MRZResult> {
        return this.extractICAOData(image);
    }

    /**
     * Extract identity data from a dual-sided document (National ID, Driver's License)
     */
    public async extractDualSideData(frontImage: File | string | Blob, backImage: File | string | Blob): Promise<MRZResult> {
        const { mrzLines } = await this.ocrExtractor.extractDualMRZ(frontImage, backImage);

        if (mrzLines.length < 2) {
            throw new NoahValidationError('Could not detect MRZ lines in the uploaded images. Please ensure the back of the ID is clearly visible.');
        }

        const fullMRZ = mrzLines.join('');

        try {
            return ICAOParser.parse(fullMRZ);
        } catch (error) {
            throw new NoahValidationError(`Failed to parse MRZ from ID card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extract data from an Aadhaar QR code
     */
    public async extractAadhaarData(image: File | string | Blob): Promise<unknown> {
        throw new NoahError('Aadhaar extraction is not yet implemented.', 'NOT_IMPLEMENTED');
    }

    /**
     * Initialize the SDK with a provider
     */
    public init(provider: unknown): void {
        this.contracts.initialize(provider);
    }

    /**
     * High-level method to prove age and grant access in one go
     */
    public async proveAndGrant(
        signer: Signer,
        protocolAddress: string,
        mrzData: MRZResult,
        targetAge: number
    ): Promise<TransactionResult> {
        try {
            // 1. Pre-flight check requirements
            const requirements = await this.contracts.getRequirements(protocolAddress);
            if (requirements.minAge > targetAge) {
                throw new NoahValidationError(`Protocol requires age ${requirements.minAge}, but target age is ${targetAge}`);
            }

            // 2. Generate Proof via API/Prover
            const userAddress = await signer.getAddress();
            const proofResult = await this.api.generateAgeProof({
                mrzData,
                minAge: targetAge,
                recipientAddress: userAddress
            });

            if (!proofResult.success) {
                throw new NoahProverError(proofResult.error || 'Unknown prover error');
            }

            // 3. Submit to Chain
            return await this.contracts.verifyAndGrantAccess(
                signer,
                proofResult.proof,
                proofResult.publicSignals,
                proofResult.credentialHash,
                userAddress
            );
        } catch (error) {
            if (error instanceof NoahError) throw error;
            throw new NoahError(error instanceof Error ? error.message : 'Unknown error', 'INTERNAL_ERROR');
        }
    }

    /**
     * Get protocol requirements via contract client
     */
    public async getProtocolRequirements(protocolAddress: string): Promise<Requirements> {
        return this.contracts.getRequirements(protocolAddress);
    }
}
