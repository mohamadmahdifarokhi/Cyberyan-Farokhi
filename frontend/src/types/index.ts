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
export interface UserCredentials {
  did: string;
  vc: VerifiableCredential;
}
export interface AuditLog {
  hash: string;
  timestamp: string;
  operation: string;
}
export interface ImageAsset {
  uri: string;
  type?: string;
  name?: string;
}
export interface RegistrationRequest {
  name: string;
  email: string;
  password?: string;
  passportImage?: ImageAsset;
  selfieImage?: ImageAsset;
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
export interface AppContextValue {
  credentials: UserCredentials | null;
  jwt: string | null;
  auditLogs: AuditLog[];
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  isAppLocked: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  fcmToken: string | null;
  isDarkMode: boolean;
  isThemeLoaded: boolean;
  setCredentials: (credentials: UserCredentials | null) => void;
  setJWT: (jwt: string | null) => void;
  addAuditLog: (log: AuditLog) => void;
  clearCredentials: () => void;
  logout: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  lockApp: () => Promise<void>;
  unlockApp: () => Promise<boolean>;
  authenticateWithBiometric: (promptMessage?: string) => Promise<boolean>;
  setFCMToken: (token: string | null) => void;
  registerFCMToken: (token: string) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
}
export interface TrendData {
  date: string;
  count: number;
}
export interface AnalyticsMetrics {
  totalRegistrations: number;
  registrationTrend: TrendData[];
  averageProcessingTime: number;
  peakHours?: Array<{ hour: number; count: number }>;
}
export type HealthStatus = 'healthy' | 'degraded' | 'down';
export interface SystemHealth {
  status: HealthStatus;
  services: {
    mongodb: HealthStatus;
    rabbitmq: HealthStatus;
    api: HealthStatus;
  };
  uptime?: number;
  timestamp: string;
}
