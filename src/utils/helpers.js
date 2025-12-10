const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const moment = require("moment");

class Helpers {
  // Generate random OTP
  static generateOTP(length = 6) {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  // Generate secure random token
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Format phone number
  static formatPhoneNumber(phone) {
    // Remove all non-digit characters except plus sign
    const cleaned = phone.replace(/[^\d+]/g, "");
    // Ensure it starts with +
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  }

  // Format date
  static formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
    return moment(date).format(format);
  }

  // Calculate expiry time
  static getExpiryTime(minutes = 10) {
    return moment().add(minutes, "minutes").toDate();
  }

  // Check if date is expired
  static isExpired(date) {
    return moment(date).isBefore(moment());
  }

  // Generate verification link
  static generateVerificationLink(token, type = "email") {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const paths = {
      email: "/api/auth/verify-email",
      password: "/api/auth/reset-password",
    };
    return `${baseUrl}${paths[type]}/${token}`;
  }

  // Sanitize user data
  static sanitizeUser(user) {
    const { password_hash, refresh_token, ...sanitized } = user;
    return sanitized;
  }

  // Delay function
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generate student ID
  static generateStudentId() {
    const prefix = "STU";
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${year}${random}`;
  }

  // Validate email format
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Validate phone format
  static isValidPhone(phone) {
    const regex = /^\+?[1-9]\d{1,14}$/;
    return regex.test(phone);
  }
}

module.exports = Helpers;
