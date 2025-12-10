const rateLimit = require("express-rate-limit");
const rateLimitConfig = require("../config/rateLimit");

// General rate limiter
const generalRateLimiter = rateLimit({
  ...rateLimitConfig,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

// OTP-specific rate limiter
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5,
  message: {
    success: false,
    error: "rate_limit_exceeded",
    message: "Too many OTP requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.phone || req.ip,
});

// Login rate limiter
const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  message: {
    success: false,
    error: "rate_limit_exceeded",
    message: "Too many login attempts. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.phone || req.ip,
});

// Password reset rate limiter
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: "rate_limit_exceeded",
    message: "Too many password reset requests. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip,
});

// Signup rate limiter
const signupRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: {
    success: false,
    error: "rate_limit_exceeded",
    message:
      "Too many signup attempts from this IP. Please try again tomorrow.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalRateLimiter,
  otpRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  signupRateLimiter,
};
