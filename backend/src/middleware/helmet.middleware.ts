import helmet from 'helmet';
import { securityConfig } from '../config/security.config';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy,
  hsts: securityConfig.helmet.hsts,
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
  ieNoOpen: true,
  dnsPrefetchControl: {
    allow: false,
  },
});

export const helmetDevMiddleware = helmet({
  contentSecurityPolicy: false,
  hsts: false,
});
