const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const OTPModel = require("../models/OTP");
const TokenModel = require("../models/Token");
const OTPService = require("./otp.service");
const EmailService = require("./email.service");
const TokenService = require("./token.service");
const Helpers = require("../utils/helpers");
const { ROLES, ERRORS, SUCCESS } = require("../utils/constants");

class AuthService {
  // Student registration
  async registerStudent(userData) {
    const {
      email,
      phone,
      password,
      fullName,
      studentId,
      department,
      yearOfStudy,
    } = userData;

    let createdUser = null;

    try {
      // Check if email exists
      if (await User.emailExists(email)) {
        throw new Error(ERRORS.USER_EXISTS);
      }

      // Check if phone exists
      if (await User.phoneExists(phone)) {
        throw new Error("Phone number already registered");
      }

      // Check if student ID exists
      if (await StudentProfile.studentIdExists(studentId)) {
        throw new Error("Student ID already registered");
      }

      // Generate temporary password if not provided (for OTP-only signup)
      const userPassword = password || Helpers.generateToken(16);

      // Create user
      const user = await User.create({
        email,
        phone,
        password: userPassword,
        fullName,
        role: ROLES.STUDENT,
      });
      createdUser = user;

      // Create student profile with default values if not provided
      await StudentProfile.create({
        userId: user.id,
        studentId,
        department: department || "Not Specified",
        yearOfStudy: yearOfStudy || 1,
      });

      // Create and send OTP for phone verification
      await OTPService.createAndSendOTP(user.id, phone, "signup");

      // Create email verification token and send email
      const emailToken = await TokenModel.createEmailVerification(user.id);
      await EmailService.sendVerificationEmail(
        email,
        emailToken.token,
        fullName
      );

      return {
        success: true,
        message: SUCCESS.SIGNUP,
        userId: user.id,
        requiresVerification: true,
      };
    } catch (error) {
      // Roll back created user (cascades to student profile)
      if (createdUser?.id) {
        try {
          await User.deleteById(createdUser.id);
        } catch (cleanupError) {
          console.error("Cleanup failed after signup error:", cleanupError);
        }
      }

      console.error("Register student error:", error);
      throw error;
    }
  }

  // Admin creates staff (librarian/admin)
  async createStaffUser(staffData, actingUser) {
    const { email, phone, password, fullName, role } = staffData;

    // Only admins can call this (route-level guard), but double-check
    if (!actingUser || actingUser.role !== ROLES.ADMIN) {
      throw new Error(ERRORS.FORBIDDEN);
    }

    if (![ROLES.LIBRARIAN, ROLES.ADMIN].includes(role)) {
      throw new Error("Invalid role. Allowed: librarian, admin");
    }

    if (await User.emailExists(email)) {
      throw new Error(ERRORS.USER_EXISTS);
    }
    if (await User.phoneExists(phone)) {
      throw new Error("Phone number already registered");
    }

    const user = await User.create({
      email,
      phone,
      password,
      fullName,
      role,
    });

    // Mark verified to allow immediate access; admins are trusted creators
    const verifiedUser = await User.update(user.id, {
      is_verified: true,
      verified_at: new Date().toISOString(),
    });

    const tokens = TokenService.generateTokens({
      ...verifiedUser,
      is_verified: true,
    });
    const userWithProfile = await User.getUserWithProfile(user.id);

    return {
      success: true,
      message: "Staff account created",
      tokens,
      token: tokens.accessToken,
      user: Helpers.sanitizeUser(userWithProfile),
    };
  }

  // Login with password
  async loginWithPassword(phone, password) {
    try {
      // Find user by phone
      const user = await User.findByPhone(phone);
      if (!user) {
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      // Check if user is active
      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Verify password
      const isValidPassword = await Helpers.comparePassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      // Check email verification
      if (!user.is_verified) {
        // Resend verification email (5-minute link)
        const emailToken = await TokenModel.createEmailVerification(user.id, 5);
        await EmailService.sendVerificationEmail(
          user.email,
          emailToken.token,
          user.full_name,
          5
        );

        return {
          success: false,
          message:
            "Please verify your email first. A new verification email has been sent (5-minute link).",
          requiresEmailVerification: true,
          userId: user.id,
          token: null,
        };
      }

      // Generate tokens
      const tokens = TokenService.generateTokens(user);
      const userWithProfile = await User.getUserWithProfile(user.id);

      return {
        success: true,
        message: SUCCESS.LOGIN,
        tokens,
        token: tokens.accessToken, // backwards compatibility
        user: Helpers.sanitizeUser(userWithProfile),
      };
    } catch (error) {
      console.error("Login with password error:", error);
      throw error;
    }
  }

  // Request login OTP
  async requestLoginOTP(phone) {
    try {
      // Find user by phone
      const user = await User.findByPhone(phone);
      if (!user) {
        // Don't reveal if user exists
        return {
          success: true,
          message: "If an account exists with this phone, an OTP will be sent.",
        };
      }

      // Check if user is active
      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Create and send OTP
      await OTPService.createAndSendOTP(user.id, phone, "login");

      return {
        success: true,
        message: "OTP sent successfully",
        userId: user.id,
      };
    } catch (error) {
      console.error("Request login OTP error:", error);
      throw error;
    }
  }

  // Login with OTP
  async loginWithOTP(userId, otp) {
    try {
      // Verify OTP
      await OTPService.verifyOTP(userId, otp, "login");

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      // Check if user is active
      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Check email verification
      if (!user.is_verified) {
        // Resend short-lived verification link
        const emailToken = await TokenModel.createEmailVerification(user.id, 5);
        await EmailService.sendVerificationEmail(
          user.email,
          emailToken.token,
          user.full_name,
          5
        );

        return {
          success: false,
          message:
            "Please verify your email before logging in. A 5-minute link has been sent.",
          requiresEmailVerification: true,
          userId: user.id,
          token: null,
        };
      }

      // Generate tokens
      const tokens = TokenService.generateTokens(user);
      const userWithProfile = await User.getUserWithProfile(user.id);

      return {
        success: true,
        message: SUCCESS.LOGIN,
        tokens,
        token: tokens.accessToken, // backwards compatibility
        user: Helpers.sanitizeUser(userWithProfile),
      };
    } catch (error) {
      console.error("Login with OTP error:", error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      // Verify token
      const tokenData = await TokenModel.verify(token, "email_verification");

      // Update user verification status
      await User.verifyEmail(tokenData.user_id);

      // Mark token as used
      await TokenModel.markAsUsed(tokenData.id);

      // Get user
      const user = await User.findById(tokenData.user_id);

      // Generate tokens
      const tokens = TokenService.generateTokens(user);
      const userWithProfile = await User.getUserWithProfile(user.id);

      // Send welcome email
      await EmailService.sendWelcomeEmail(user.email, user.full_name);

      return {
        success: true,
        message: SUCCESS.EMAIL_VERIFIED,
        tokens,
        token: tokens.accessToken, // backwards compatibility
        user: Helpers.sanitizeUser(userWithProfile),
      };
    } catch (error) {
      console.error("Verify email error:", error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return {
          success: true,
          message:
            "If an account exists with this email, a reset link will be sent.",
        };
      }

      // Create password reset token
      const tokenData = await TokenModel.createPasswordReset(user.id);

      // Send reset email
      await EmailService.sendPasswordResetEmail(
        email,
        tokenData.token,
        user.full_name
      );

      return {
        success: true,
        message: SUCCESS.PASSWORD_RESET_SENT,
      };
    } catch (error) {
      console.error("Request password reset error:", error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const tokenData = await TokenModel.verify(token, "password_reset");

      // Update password
      await User.updatePassword(tokenData.user_id, newPassword);

      // Mark token as used
      await TokenModel.markAsUsed(tokenData.id);

      // Get user for notification
      const user = await User.findById(tokenData.user_id);

      // Send password changed notification
      await EmailService.sendPasswordResetEmail(user.email, "", user.full_name);

      return {
        success: true,
        message: SUCCESS.PASSWORD_CHANGED,
      };
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  // Change password (authenticated)
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      // Verify current password
      const isValid = await Helpers.comparePassword(
        currentPassword,
        user.password_hash
      );
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      // Send notification email
      await EmailService.sendPasswordResetEmail(user.email, "", user.full_name);

      return {
        success: true,
        message: SUCCESS.PASSWORD_CHANGED,
      };
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }

  // Verify OTP for signup
  async verifySignupOTP(userId, otp) {
    try {
      // Verify OTP (throws on invalid/expired)
      await OTPService.verifyOTP(userId, otp, "signup");

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      // Always issue tokens after phone verification; include email status
      const tokens = TokenService.generateTokens(user);
      const userWithProfile = await User.getUserWithProfile(user.id);

      // If email not verified, send a short-lived 5-minute verification email
      if (!user.is_verified) {
        const emailToken = await TokenModel.createEmailVerification(user.id, 5);
        await EmailService.sendVerificationEmail(
          user.email,
          emailToken.token,
          user.full_name,
          5
        );

        // Schedule deletion of unverified account after token expiry (5m)
        // (fire-and-forget; best-effort cleanup)
        setTimeout(async () => {
          try {
            const freshUser = await User.findById(user.id);
            if (freshUser && !freshUser.is_verified) {
              await User.deleteById(user.id);
              console.warn(
                `Deleted unverified user ${user.id} after email token expiry`
              );
            }
          } catch (cleanupError) {
            console.error(
              `Cleanup failed for unverified user ${user.id}:`,
              cleanupError
            );
          }
        }, 5 * 60 * 1000);
      }

      return {
        success: true,
        message: user.is_verified
          ? "Phone verified successfully"
          : "Phone verified. Please verify your email within 5 minutes to avoid account removal.",
        tokens,
        token: tokens.accessToken, // backwards compatibility for clients expecting `token`
        requiresEmailVerification: !user.is_verified,
        user: Helpers.sanitizeUser(userWithProfile),
      };
    } catch (error) {
      console.error("Verify signup OTP error:", error);
      throw error;
    }
  }

  // Resend verification email
  async resendVerificationEmail(userId) {
    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      if (user.is_verified) {
        throw new Error("Email is already verified");
      }

      // Create short-lived 5-minute email token
      const emailToken = await TokenModel.createEmailVerification(user.id, 5);

      // Send verification email with 5-minute expiry messaging
      await EmailService.sendVerificationEmail(
        user.email,
        emailToken.token,
        user.full_name,
        5
      );

      return {
        success: true,
        message:
          "Verification email resent successfully. Link expires in 5 minutes.",
      };
    } catch (error) {
      console.error("Resend verification email error:", error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = TokenService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      // Check if user is active
      if (user.status !== "active") {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Generate new tokens
      const tokens = TokenService.generateTokens(user);

      return {
        success: true,
        message: "Token refreshed successfully",
        tokens,
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      throw new Error("Invalid or expired refresh token");
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.getUserWithProfile(userId);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      return {
        success: true,
        user: Helpers.sanitizeUser(user),
      };
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(userId, updates) {
    try {
      // Remove restricted fields
      const { email, phone, role, ...allowedUpdates } = updates;

      // Update user
      const updatedUser = await User.update(userId, allowedUpdates);

      return {
        success: true,
        message: SUCCESS.PROFILE_UPDATED,
        user: Helpers.sanitizeUser(updatedUser),
      };
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }
}

module.exports = new AuthService();
