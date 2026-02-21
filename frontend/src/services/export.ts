import { Share, Platform } from 'react-native';
import { UserCredentials } from '../types';

export interface ExportedCredential {
  did: string;
  vc: UserCredentials['vc'];
  exportedAt: string;
  signature: string;
}
export interface ExportOptions {
  includeSignature?: boolean;
  format?: 'json' | 'pretty';
}

export class ExportService {
  static credentialToJSON(credentials: UserCredentials, options: ExportOptions = {}): string {
    const { includeSignature = true, format = 'pretty' } = options;
    const exportData: ExportedCredential = {
      did: credentials.did,
      vc: credentials.vc,
      exportedAt: new Date().toISOString(),
      signature: includeSignature ? this.generateSignature(credentials) : '',
    };

    if (format === 'pretty') {
      return JSON.stringify(exportData, null, 2);
    }

    return JSON.stringify(exportData);
  }

  static generateSignature(credentials: UserCredentials): string {
    try {
      const credentialData = JSON.stringify({
        did: credentials.did,
        vc: credentials.vc,
      });
      const signature = btoa(credentialData);

      return signature;
    } catch (error) {
      console.error('Error generating signature:', error);
      throw new Error('Failed to generate signature');
    }
  }

  static verifySignature(exportedCredential: ExportedCredential): boolean {
    try {
      const credentials: UserCredentials = {
        did: exportedCredential.did,
        vc: exportedCredential.vc,
      };
      const expectedSignature = this.generateSignature(credentials);

      return expectedSignature === exportedCredential.signature;
    } catch (error) {
      console.error('Error verifying signature:', error);

      return false;
    }
  }

  private static downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async exportAndShare(
    credentials: UserCredentials,
    options: ExportOptions = {},
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const jsonString = this.credentialToJSON(credentials, options);

      if (Platform.OS === 'web') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `credential-${timestamp}.json`;

        this.downloadFile(jsonString, filename);

        return { success: true };
      }
      const shareOptions = {
        message: jsonString,
        title: 'Export Verifiable Credential',
        ...(Platform.OS === 'ios' && {
          subject: 'Verifiable Credential Export',
        }),
      };
      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        return { success: true };
      } else if (result.action === Share.dismissedAction) {
        return { success: false, error: 'Share dismissed by user' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting credential:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static parseExportedCredential(jsonString: string): ExportedCredential {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed.did || !parsed.vc || !parsed.exportedAt) {
        throw new Error('Invalid exported credential format');
      }

      return parsed as ExportedCredential;
    } catch (error) {
      console.error('Error parsing exported credential:', error);
      throw new Error('Failed to parse exported credential');
    }
  }
}
