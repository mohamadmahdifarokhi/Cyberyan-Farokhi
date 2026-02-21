import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { securityConfig } from '../config/security.config';

export const apiLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000 / 60),
    });
  },
});

export const registrationLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.registrationWindowMs,
  max: securityConfig.rateLimit.registrationMaxRequests,
  message: {
    success: false,
    error: 'Too many registration attempts from this IP, please try again later.',
    retryAfter: Math.ceil(securityConfig.rateLimit.registrationWindowMs / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil(securityConfig.rateLimit.registrationWindowMs / 1000 / 60),
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 15,
    });
  },
});

export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Too many requests, please slow down.',
    retryAfter: 1,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.',
      retryAfter: 1,
    });
  },
});

export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60),
      });
    },
  });
};
