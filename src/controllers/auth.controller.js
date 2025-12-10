const authService = require("../services/auth.service");
const errorHandler = require("../middleware/errorHandler");

const authController = {
  // Student Registration
  registerStudent: errorHandler.asyncHandler(async (req, res) => {
    const result = await authService.registerStudent(req.validatedData);
    res.status(201).json(result);
  }),

  // Login with Password
  loginWithPassword: errorHandler.asyncHandler(async (req, res) => {
    const { phone, password } = req.validatedData;
    const result = await authService.loginWithPassword(phone, password);
    res.status(200).json(result);
  }),

  // Request Login OTP
  requestLoginOTP: errorHandler.asyncHandler(async (req, res) => {
    const { phone } = req.validatedData;
    const result = await authService.requestLoginOTP(phone);
    res.status(200).json(result);
  }),

  // Login with OTP
  loginWithOTP: errorHandler.asyncHandler(async (req, res) => {
    const { userId, otp } = req.validatedData;
    const result = await authService.loginWithOTP(userId, otp);
    res.status(200).json(result);
  }),

  // Verify Email
  verifyEmail: errorHandler.asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);

    // Redirect to frontend on success
    if (req.accepts("html")) {
      const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const redirectUrl = `${frontendUrl}/auth/verification-success?token=${result.tokens.accessToken}`;
      return res.redirect(redirectUrl);
    }

    res.status(200).json(result);
  }),

  // Request Password Reset
  requestPasswordReset: errorHandler.asyncHandler(async (req, res) => {
    const { email } = req.validatedData;
    const result = await authService.requestPasswordReset(email);
    res.status(200).json(result);
  }),

  // Reset Password
  resetPassword: errorHandler.asyncHandler(async (req, res) => {
    const { token, newPassword } = req.validatedData;
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  }),

  // Change Password
  changePassword: errorHandler.asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.validatedData;
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.status(200).json(result);
  }),

  // Admin creates staff (librarian/admin)
  createStaffUser: errorHandler.asyncHandler(async (req, res) => {
    const result = await authService.createStaffUser(
      req.validatedData,
      req.user
    );
    res.status(201).json(result);
  }),

  // Verify Signup OTP
  verifySignupOTP: errorHandler.asyncHandler(async (req, res) => {
    const { userId, otp } = req.validatedData;
    const result = await authService.verifySignupOTP(userId, otp);
    res.status(200).json(result);
  }),

  // Resend Verification Email
  resendVerificationEmail: errorHandler.asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const result = await authService.resendVerificationEmail(userId);
    res.status(200).json(result);
  }),

  // Refresh Token
  refreshToken: errorHandler.asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(result);
  }),

  // Get Profile
  getProfile: errorHandler.asyncHandler(async (req, res) => {
    const result = await authService.getProfile(req.user.id);
    res.status(200).json(result);
  }),

  // Update Profile
  updateProfile: errorHandler.asyncHandler(async (req, res) => {
    const result = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json(result);
  }),

  // Logout
  logout: errorHandler.asyncHandler(async (req, res) => {
    // In a real app, you might want to blacklist the token
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }),

  // Health Check
  healthCheck: errorHandler.asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Auth service is healthy",
      timestamp: new Date().toISOString(),
      service: "PortLib Auth Service",
    });
  }),
};

module.exports = authController;
