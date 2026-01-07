module.exports = {
  // User Roles
  ROLES: {
    STUDENT: "student",
    LIBRARIAN: "librarian",
    ADMIN: "admin",
  },

  // OTP Types
  OTP_TYPES: {
    SIGNUP: "signup",
    LOGIN: "login",
    PASSWORD_RESET: "password_reset",
    EMAIL_VERIFICATION: "email_verification",
  },

  // Token Types
  TOKEN_TYPES: {
    EMAIL_VERIFICATION: "email_verification",
    PASSWORD_RESET: "password_reset",
    REFRESH: "refresh",
  },

  // Status Codes
  STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
    PENDING: "pending",
  },

  // Error Messages
  ERRORS: {
    INVALID_CREDENTIALS: "Invalid credentials",
    USER_NOT_FOUND: "User not found",
    USER_EXISTS: "User already exists",
    INVALID_OTP: "Invalid or expired OTP",
    OTP_RATE_LIMIT: "Too many OTP requests. Please try again later.",
    INVALID_TOKEN: "Invalid or expired token",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    VALIDATION_ERROR: "Validation failed",
    SERVER_ERROR: "Internal server error",
  },

  // Success Messages
  SUCCESS: {
    SIGNUP: "Registration successful. Please verify your email.",
    LOGIN: "Login successful",
    LOGOUT: "Logout successful",
    OTP_SENT: "OTP sent successfully",
    EMAIL_VERIFIED: "Email verified successfully",
    PASSWORD_RESET_SENT: "Password reset instructions sent to your email",
    PASSWORD_CHANGED: "Password changed successfully",
    PROFILE_UPDATED: "Profile updated successfully",
  },

  // Validation Rules
  VALIDATION: {
    PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 6,
    PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STUDENT_ID_REGEX: /^[A-Z]{3}\d{6}$/,
    OTP_LENGTH: 6,
    TOKEN_LENGTH: 64,
    MAX_BORROW_DAYS: 30,
    DAILY_FINE_RATE: 2.0,
    MAX_BORROW_LIMIT: 5,
  },

  // Time Constants (in seconds)
  TIME: {
    OTP_EXPIRY: parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 || 600, // 10 minutes
    REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60, // 30 days
    ACCESS_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days
    EMAIL_TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours
    PASSWORD_TOKEN_EXPIRY: 60 * 60, // 1 hour
  },
  // Added new constants for Library Management System:
  BOOK_STATUS: {
    AVAILABLE: "available",
    BORROWED: "borrowed",
    RESERVED: "reserved",
    LOST: "lost",
    DAMAGED: "damaged",
  },

  BORROW_STATUS: {
    BORROWED: "borrowed",
    RETURNED: "returned",
    OVERDUE: "overdue",
    LOST: "lost",
  },
};
