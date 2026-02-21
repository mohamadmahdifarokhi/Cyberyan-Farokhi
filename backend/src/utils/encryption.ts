import CryptoJS from 'crypto-js';
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not defined');
  }
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters for AES-256');
  }
  return key;
};
export function encrypt(data: string): string {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key);
    return encrypted.toString();
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plainText) {
      throw new Error('Decryption resulted in empty string - possibly wrong key or corrupted data');
    }
    return plainText;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
export function encryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const result = { ...obj } as any;
  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]);
    }
  }
  return result as T;
}
export function decryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const result = { ...obj } as any;
  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      result[field] = decrypt(result[field]);
    }
  }
  return result as T;
}
