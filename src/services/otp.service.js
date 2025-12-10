const twilio = require("twilio");
const OTPModel = require("../models/OTP");
const { OTP_TYPES, ERRORS } = require("../utils/constants");

class OTPService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  // Send OTP via SMS
  async sendSMS(phone, otp, type = "verification") {
    try {
      const messages = {
        signup: `Your PortLib verification code is: ${otp}. It expires in 10 minutes.`,
        login: `Your PortLib login code is: ${otp}. It expires in 10 minutes.`,
        password_reset: `Your PortLib password reset code is: ${otp}. It expires in 10 minutes.`,
      };

      const message = await this.client.messages.create({
        body:
          messages[type] ||
          `Your PortLib code is: ${otp}. It expires in 10 minutes.`,
        from: this.phoneNumber,
        to: phone,
      });

      return { success: true, messageId: message.sid };
    } catch (error) {
      const details =
        error?.message ||
        error?.moreInfo ||
        error?.code ||
        "Unknown SMS send error";
      console.error("Send SMS error:", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        moreInfo: error?.moreInfo,
      });
      throw new Error(`Failed to send SMS. ${details}`);
    }
  }

  // Create and send OTP
  async createAndSendOTP(userId, phone, type = OTP_TYPES.LOGIN) {
    try {
      // Clean expired OTPs first
      await OTPModel.cleanExpired();

      // Check rate limiting
      const attempts = await OTPModel.getAttemptsCount(userId, 1);
      const maxAttempts = parseInt(process.env.MAX_OTP_ATTEMPTS, 10) || 3;
      if (attempts >= maxAttempts) {
        throw new Error(ERRORS.OTP_RATE_LIMIT);
      }

      // Check if user has active OTP
      const hasActive = await OTPModel.hasActiveOTP(userId, type);
      if (hasActive) {
        throw new Error(
          "An active OTP already exists. Please wait before requesting a new one."
        );
      }

      // Create OTP
      const otpData = await OTPModel.create({
        userId,
        type,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
      });

      // Send OTP via SMS
      await this.sendSMS(phone, otpData.otpCode, type);

      return {
        success: true,
        message: "OTP sent successfully",
        otpId: otpData.id,
        // In production, don't return the OTP code
        ...(process.env.NODE_ENV === "development" && { otp: otpData.otpCode }),
      };
    } catch (error) {
      console.error("Create and send OTP error:", error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(userId, otpCode, type = OTP_TYPES.LOGIN) {
    try {
      const otp = await OTPModel.verify(userId, otpCode, type);
      return {
        success: true,
        message: "OTP verified successfully",
        otp,
      };
    } catch (error) {
      throw error;
    }
  }

  // Resend OTP
  async resendOTP(userId, phone, type = OTP_TYPES.SIGNUP) {
    try {
      // Check cooldown
      const latestOTP = await OTPModel.getLatest(userId, type);
      if (latestOTP) {
        const cooldown = parseInt(process.env.OTP_RESEND_COOLDOWN) || 60;
        const lastSent = new Date(latestOTP.created_at);
        const now = new Date();
        const secondsSinceLast = (now - lastSent) / 1000;

        if (secondsSinceLast < cooldown) {
          const waitTime = Math.ceil(cooldown - secondsSinceLast);
          throw new Error(
            `Please wait ${waitTime} seconds before requesting a new OTP`
          );
        }
      }

      // Create and send new OTP
      return await this.createAndSendOTP(userId, phone, type);
    } catch (error) {
      console.error("Resend OTP error:", error);
      throw error;
    }
  }

  // Cleanup service (run periodically)
  async cleanup() {
    try {
      await OTPModel.cleanExpired();
    } catch (error) {
      console.error("OTP cleanup error:", error);
    }
  }
}

module.exports = new OTPService();
