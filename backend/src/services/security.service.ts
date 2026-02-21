import bcrypt from 'bcrypt';
import { encrypt, decrypt } from '../utils/encryption';

const SALT_ROUNDS = 10;

export class SecurityService {
  encrypt(data: string): string {
    return encrypt(data);
  }

  decrypt(encryptedData: string): string {
    return decrypt(encryptedData);
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      return hash;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      const match = await bcrypt.compare(password, hash);
      return match;
    } catch (error) {
      throw new Error(`Password comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input.replace(/\0/g, '');

    sanitized = sanitized.replace(/[<>]/g, '').replace(/[{}]/g, '').replace(/[$]/g, '').replace(/[;]/g, '').trim();

    return sanitized;
  }

  sanitizeHTML(html: string): string {
    if (typeof html !== 'string') {
      return '';
    }

    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  validateEmail(email: string): boolean {
    if (typeof email !== 'string') {
      return false;
    }

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  validateDID(did: string): boolean {
    if (typeof did !== 'string') {
      return false;
    }

    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/;
    return didRegex.test(did);
  }

  validatePassword(password: string): boolean {
    if (typeof password !== 'string') {
      return false;
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  validateLength(str: string, minLength: number, maxLength: number): boolean {
    if (typeof str !== 'string') {
      return false;
    }
    return str.length >= minLength && str.length <= maxLength;
  }

  isAlphanumeric(str: string): boolean {
    if (typeof str !== 'string') {
      return false;
    }
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  validateJWTFormat(token: string): boolean {
    if (typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isSafeInput(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    const dangerousPatterns = [
      /(\$where)/i,
      /(\$ne)/i,
      /(javascript:)/i,
      /(<script)/i,
      /(onerror=)/i,
      /(onload=)/i,
      /(eval\()/i,
      /(exec\()/i,
      /(union.*select)/i,
      /(drop.*table)/i,
      /(insert.*into)/i,
      /(delete.*from)/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(input));
  }
}

export const securityService = new SecurityService();
