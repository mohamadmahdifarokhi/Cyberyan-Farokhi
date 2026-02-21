import { Request, Response } from 'express';
import { didService } from '../services/didService';
import { vcService } from '../services/vcService';
import { jwtService } from '../services/jwtService';
import { auditService } from '../services/auditService';
import { RegistrationRequest, RegistrationResponse } from '../types';

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, passportImage, selfieImage } = req.body as RegistrationRequest;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
