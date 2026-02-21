import { Share } from 'react-native';
import { ExportService, ExportedCredential } from '../services/export';
import { UserCredentials } from '../types';

jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('ExportService', () => {
  const mockCredentials: UserCredentials = {
    did: 'did:example:123456789',
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer: 'did:example:issuer',
      issuanceDate: '2024-01-01T00:00:00.000Z',
      credentialSubject: {
        id: 'did:example:subject123',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('credentialToJSON', () => {
    it('should convert credential to JSON string', () => {
      const result = ExportService.credentialToJSON(mockCredentials);

      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should include all required fields in JSON', () => {
      const result = ExportService.credentialToJSON(mockCredentials);
      const parsed: ExportedCredential = JSON.parse(result);

      expect(parsed).toHaveProperty('did');
      expect(parsed).toHaveProperty('vc');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('signature');
    });

    it('should preserve credential data in JSON', () => {
      const result = ExportService.credentialToJSON(mockCredentials);
      const parsed: ExportedCredential = JSON.parse(result);

      expect(parsed.did).toBe(mockCredentials.did);
      expect(parsed.vc).toEqual(mockCredentials.vc);
    });

    it('should include signature by default', () => {
      const result = ExportService.credentialToJSON(mockCredentials);
      const parsed: ExportedCredential = JSON.parse(result);

      expect(parsed.signature).toBeTruthy();
      expect(parsed.signature.length).toBeGreaterThan(0);
    });

    it('should exclude signature when includeSignature is false', () => {
      const result = ExportService.credentialToJSON(mockCredentials, {
        includeSignature: false,
      });
      const parsed: ExportedCredential = JSON.parse(result);

      expect(parsed.signature).toBe('');
    });

    it('should format as pretty JSON by default', () => {
      const result = ExportService.credentialToJSON(mockCredentials);

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('should format as compact JSON when format is json', () => {
      const result = ExportService.credentialToJSON(mockCredentials, {
        format: 'json',
      });

      const parsed = JSON.parse(result);
      const recompacted = JSON.stringify(parsed);

      expect(result).toBe(recompacted);
    });

    it('should include valid ISO timestamp', () => {
      const result = ExportService.credentialToJSON(mockCredentials);
      const parsed: ExportedCredential = JSON.parse(result);

      expect(parsed.exportedAt).toBeTruthy();
      const date = new Date(parsed.exportedAt);

      expect(date.toISOString()).toBe(parsed.exportedAt);
    });
  });

  describe('generateSignature', () => {
    it('should generate a signature for credentials', () => {
      const signature = ExportService.generateSignature(mockCredentials);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should generate consistent signatures for same credentials', () => {
      const signature1 = ExportService.generateSignature(mockCredentials);
      const signature2 = ExportService.generateSignature(mockCredentials);

      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different credentials', () => {
      const credentials2: UserCredentials = {
        ...mockCredentials,
        did: 'did:example:different',
      };

      const signature1 = ExportService.generateSignature(mockCredentials);
      const signature2 = ExportService.generateSignature(credentials2);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate signature with expected format', () => {
      const signature = ExportService.generateSignature(mockCredentials);

      expect(signature.length).toBeGreaterThan(0);

      expect(signature).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);
      const exported: ExportedCredential = JSON.parse(jsonString);

      const isValid = ExportService.verifySignature(exported);

      expect(isValid).toBe(true);
    });

    it('should reject tampered credential data', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);
      const exported: ExportedCredential = JSON.parse(jsonString);

      const tamperedExported = JSON.parse(JSON.stringify(exported));

      tamperedExported.vc.credentialSubject.name = 'Tampered Name';

      const isValid = ExportService.verifySignature(tamperedExported);

      expect(isValid).toBe(false);
    });

    it('should reject tampered DID', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);
      const exported: ExportedCredential = JSON.parse(jsonString);

      exported.did = 'did:example:tampered';

      const isValid = ExportService.verifySignature(exported);

      expect(isValid).toBe(false);
    });

    it('should reject invalid signature', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);
      const exported: ExportedCredential = JSON.parse(jsonString);

      exported.signature = 'invalid_signature_12345';

      const isValid = ExportService.verifySignature(exported);

      expect(isValid).toBe(false);
    });
  });

  describe('exportAndShare', () => {
    it('should call Share.share with correct parameters', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.sharedAction,
      });

      await ExportService.exportAndShare(mockCredentials);

      expect(Share.share).toHaveBeenCalledTimes(1);
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          title: 'Export Verifiable Credential',
        }),
      );
    });

    it('should return success when share is completed', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.sharedAction,
      });

      const result = await ExportService.exportAndShare(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return failure when share is dismissed', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.dismissedAction,
      });

      const result = await ExportService.exportAndShare(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share dismissed by user');
    });

    it('should handle share errors gracefully', async () => {
      const errorMessage = 'Share failed';

      (Share.share as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const result = await ExportService.exportAndShare(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should include signature in shared data by default', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.sharedAction,
      });

      await ExportService.exportAndShare(mockCredentials);

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      const sharedData: ExportedCredential = JSON.parse(callArgs.message);

      expect(sharedData.signature).toBeTruthy();
      expect(sharedData.signature.length).toBeGreaterThan(0);
    });

    it('should respect export options', async () => {
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.sharedAction,
      });

      await ExportService.exportAndShare(mockCredentials, {
        includeSignature: false,
        format: 'json',
      });

      const callArgs = (Share.share as jest.Mock).mock.calls[0][0];
      const sharedData: ExportedCredential = JSON.parse(callArgs.message);

      expect(sharedData.signature).toBe('');
    });
  });

  describe('parseExportedCredential', () => {
    it('should parse valid exported credential JSON', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);

      const parsed = ExportService.parseExportedCredential(jsonString);

      expect(parsed).toHaveProperty('did');
      expect(parsed).toHaveProperty('vc');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('signature');
    });

    it('should preserve credential data when parsing', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);

      const parsed = ExportService.parseExportedCredential(jsonString);

      expect(parsed.did).toBe(mockCredentials.did);
      expect(parsed.vc).toEqual(mockCredentials.vc);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = 'not valid json {';

      expect(() => ExportService.parseExportedCredential(invalidJson)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const incompleteJson = JSON.stringify({
        did: 'did:example:123',
      });

      expect(() => ExportService.parseExportedCredential(incompleteJson)).toThrow(
        'Failed to parse exported credential',
      );
    });

    it('should throw error for empty JSON object', () => {
      const emptyJson = JSON.stringify({});

      expect(() => ExportService.parseExportedCredential(emptyJson)).toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should complete full export-parse-verify cycle', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);

      const parsed = ExportService.parseExportedCredential(jsonString);

      const isValid = ExportService.verifySignature(parsed);

      expect(isValid).toBe(true);
      expect(parsed.did).toBe(mockCredentials.did);
      expect(parsed.vc).toEqual(mockCredentials.vc);
    });

    it('should detect tampering in export-parse-verify cycle', () => {
      const jsonString = ExportService.credentialToJSON(mockCredentials);

      const parsed = ExportService.parseExportedCredential(jsonString);

      const tamperedParsed = JSON.parse(JSON.stringify(parsed));

      tamperedParsed.vc.credentialSubject.email = 'tampered@example.com';

      const isValid = ExportService.verifySignature(tamperedParsed);

      expect(isValid).toBe(false);
    });

    it('should handle multiple exports of same credential', () => {
      const export1 = ExportService.credentialToJSON(mockCredentials);
      const export2 = ExportService.credentialToJSON(mockCredentials);

      const parsed1: ExportedCredential = JSON.parse(export1);
      const parsed2: ExportedCredential = JSON.parse(export2);

      expect(parsed1.signature).toBe(parsed2.signature);

      expect(ExportService.verifySignature(parsed1)).toBe(true);
      expect(ExportService.verifySignature(parsed2)).toBe(true);
    });
  });
});
