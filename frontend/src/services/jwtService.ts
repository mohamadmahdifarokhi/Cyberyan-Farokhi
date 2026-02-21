export class JWTService {
  verifyJWT(token: string): { email?: string; [key: string]: unknown } {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = parts[1];
      const decoded = JSON.parse(this.base64UrlDecode(payload)) as { email?: string; [key: string]: unknown };

      return decoded;
    } catch {
      throw new Error('Invalid or malformed token');
    }
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    try {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
    } catch {
      throw new Error('Failed to decode token');
    }
  }
}
export const jwtService = new JWTService();
