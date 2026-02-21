export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    name: string;
    email: string;
  };
}
export interface RegistrationRequest {
  name: string;
  email: string;
  password?: string;
  passportImage?: string;
  selfieImage?: string;
}
export interface RegistrationResponse {
  did: string;
  vc: VerifiableCredential;
  jwt: string;
  email: string;
  auditHash: string;
}
export interface AuthRequest {
  email: string;
  password?: string;
}
export interface AuthResponse {
  jwt: string;
  email: string;
  did?: string;
  vc?: VerifiableCredential;
}
export interface AuditLog {
  hash: string;
  timestamp: string;
  operation: string;
  did: string;
}
