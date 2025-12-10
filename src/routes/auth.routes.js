const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth");
const validatorMiddleware = require("../middleware/validator");
const rateLimiter = require("../middleware/rateLimiter");

// Apply general rate limiting to all routes
router.use(rateLimiter.generalRateLimiter);

// Health check (no auth required)
router.get("/health", authController.healthCheck);

// Public routes
router.post(
  "/register/student",
  rateLimiter.signupRateLimiter,
  validatorMiddleware.validateSignup,
  authController.registerStudent
);

router.post(
  "/login/password",
  rateLimiter.loginRateLimiter,
  validatorMiddleware.validateLogin,
  authController.loginWithPassword
);

router.post(
  "/login/otp/request",
  rateLimiter.otpRateLimiter,
  validatorMiddleware.validateEmail,
  authController.requestLoginOTP
);

router.post(
  "/login/otp/verify",
  validatorMiddleware.validateOTP,
  authController.loginWithOTP
);

router.post(
  "/password/reset/request",
  rateLimiter.passwordResetRateLimiter,
  validatorMiddleware.validateEmail,
  authController.requestPasswordReset
);

router.post(
  "/password/reset",
  validatorMiddleware.validatePasswordReset,
  authController.resetPassword
);

router.get("/verify-email/:token", authController.verifyEmail);

router.post(
  "/verify/signup-otp",
  validatorMiddleware.validateOTP,
  authController.verifySignupOTP
);

router.post("/resend-verification", authController.resendVerificationEmail);

router.post("/refresh-token", authController.refreshToken);

// Protected routes (require authentication)
router.use(authMiddleware.authenticate);

router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.post("/logout", authController.logout);

router.post(
  "/password/change",
  validatorMiddleware.validateChangePassword,
  authController.changePassword
);

// Admin-only: create librarian/admin users
router.post(
  "/admin/users",
  authMiddleware.authenticate,
  authMiddleware.requireRole("admin"),
  validatorMiddleware.validateStaffSignup,
  authController.createStaffUser
);

// Admin only routes (example)
router.get("/admin/users", authMiddleware.requireRole("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

module.exports = router;
