import { Request, Response } from 'express';
import { jwtService } from '../services/jwtService';
import { authService } from '../services/authService';
import { didService } from '../services/didService';
import { vcService } from '../services/vcService';
import { auditService } from '../services/auditService';
import { AuthRequest, AuthResponse, RegistrationRequest, RegistrationResponse } from '../types';

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, passportImage, selfieImage } = req.body as RegistrationRequest;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    if (password) {
      const validation = authService.validatePassword(password);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }
      try {
        const user = await authService.registerUser(email, password, name);
        const did = didService.generateDID();
        const vc = vcService.createVC(did, name, email);
        user.did = did;
        user.vc = vc;
        await user.save();
        const jwt = jwtService.generateJWT(email, did, user._id.toString());
        const timestamp = new Date().toISOString();
        const auditHash = auditService.generateAuditHash(did, 'credential_issuance', timestamp);
        const response: RegistrationResponse = {
          did,
          vc,
          jwt,
          email,
          auditHash,
        };
        res.status(201).json(response);
      } catch (error: any) {
        if (error.message === 'User already exists') {
          res.status(409).json({ error: 'Email already registered' });
        } else {
          throw error;
        }
      }
    } else {
      const did = didService.generateDID();
      const vc = vcService.createVC(did, name, email);
      const jwt = jwtService.generateJWT(email, did);
      const timestamp = new Date().toISOString();
      const auditHash = auditService.generateAuditHash(did, 'credential_issuance', timestamp);
      const response: RegistrationResponse = {
        did,
        vc,
        jwt,
        email,
        auditHash,
      };
      res.status(201).json(response);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as AuthRequest;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = await authService.authenticateUser(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const jwt = jwtService.generateJWT(user.email, user.did, user._id.toString());
    const vc = user.vc || vcService.createVC(user.did || '', user.name || '', user.email);
    const response: AuthResponse = {
      jwt,
      email: user.email,
      did: user.did,
      vc,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const authHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as AuthRequest;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const jwt = jwtService.generateJWT(email);
    const response: AuthResponse = {
      jwt,
      email,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
