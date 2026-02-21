export const securityConfig = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  jwt: {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
    algorithm: 'HS256' as const,
    issuer: 'vc-did-system',
    audience: 'vc-did-users',
  },
  encryption: {
    algorithm: 'AES-256',
    keyLength: 32,
  },
  validation: {
    maxInputLength: 10000,
    maxFileSize: 5 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    maxImageSize: 2 * 1024 * 1024,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    registrationWindowMs: parseInt(process.env.RATE_LIMIT_REGISTRATION_WINDOW_MS || '900000'),
    registrationMaxRequests: parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX || '5'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
};
