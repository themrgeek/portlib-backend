const db = require("../config/database");
const Helpers = require("../utils/helpers");

class OTP {
  // Create OTP
  static async create(otpData) {
    const { userId, type, expiryMinutes = 10 } = otpData;

    try {
      const otpCode = Helpers.generateOTP();
      const expiresAt = Helpers.getExpiryTime(expiryMinutes);

      const { data, error } = await db
        .getAdminClient()
        .from("otps")
        .insert({
          user_id: userId,
          otp_code: otpCode,
          otp_type: type,
          expires_at: expiresAt,
          is_used: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, otpCode };
    } catch (error) {
      console.error("OTP.create error:", error);
      throw new Error(error.message || "Failed to create OTP");
    }
  }

  // Verify OTP
  static async verify(userId, otpCode, type) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await db
        .getAdminClient()
        .from("otps")
        .select("*")
        .eq("user_id", userId)
        .eq("otp_code", otpCode)
        .eq("otp_type", type)
        .eq("is_used", false)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Invalid or expired OTP");
        }
        throw error;
      }

      // Mark OTP as used
      await db
        .getAdminClient()
        .from("otps")
        .update({ is_used: true })
        .eq("id", data.id);

      return data;
    } catch (error) {
      console.error("OTP.verify error:", error);
      throw new Error(error.message || "Failed to verify OTP");
    }
  }

  // Get latest OTP for user
  static async getLatest(userId, type) {
    try {
      const { data, error } = await db
        .getClient()
        .from("otps")
        .select("*")
        .eq("user_id", userId)
        .eq("otp_type", type)
        .eq("is_used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("OTP.getLatest error:", error);
      throw error;
    }
  }

  // Check if user has active OTP
  static async hasActiveOTP(userId, type) {
    const otp = await this.getLatest(userId, type);
    if (!otp) return false;

    return !Helpers.isExpired(otp.expires_at);
  }

  // Clean expired OTPs
  static async cleanExpired() {
    try {
      const now = new Date().toISOString();

      const { error } = await db
        .getAdminClient()
        .from("otps")
        .delete()
        .lt("expires_at", now);

      if (error) throw error;
    } catch (error) {
      console.error("OTP.cleanExpired error:", error);
    }
  }

  // Get OTP attempts count
  static async getAttemptsCount(userId, hours = 1) {
    try {
      const cutoffTime = new Date(
        Date.now() - hours * 60 * 60 * 1000
      ).toISOString();

      const { count, error } = await db
        .getClient()
        .from("otps")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gt("created_at", cutoffTime);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error("OTP.getAttemptsCount error:", error);
      return 0;
    }
  }
}

module.exports = OTP;
