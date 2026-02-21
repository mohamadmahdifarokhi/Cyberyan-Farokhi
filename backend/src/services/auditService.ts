import crypto from 'crypto';

export class AuditService {
  generateAuditHash(did: string, operation: string, timestamp: string): string {
    const data = `${did}:${operation}:${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export const auditService = new AuditService();
