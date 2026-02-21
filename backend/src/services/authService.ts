import bcrypt from 'bcrypt';
import { UserModel, IUser } from '../models/User.model';
const SALT_ROUNDS = 10;
class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    return { valid: true };
  }
  async registerUser(email: string, password: string, name?: string): Promise<IUser> {
    const validation = this.validatePassword(password);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const passwordHash = await this.hashPassword(password);
    const user = new UserModel({
      email: email.toLowerCase(),
      passwordHash,
      name,
    });
    await user.save();
    return user;
  }
  async authenticateUser(email: string, password: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return null;
    }
    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    return user;
  }
}
export const authService = new AuthService();
