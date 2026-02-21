import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';
export class JWTService {
  generateJWT(email: string, did?: string, userId?: string): string {
    const payload = {
      email,
      sub: userId || did || email,
      did,
      iat: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  }
  verifyJWT(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
export const jwtService = new JWTService();
