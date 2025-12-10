const db = require("../config/database");
const Helpers = require("../utils/helpers");
const { TOKEN_TYPES } = require("../utils/constants");

class Token {
  // Create token
  static async create(tokenData) {
    const { userId, type, expiryHours } = tokenData;

    try {
      const token = Helpers.generateToken();
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      const { data, error } = await db
        .getAdminClient()
        .from("tokens")
        .insert({
          user_id: userId,
          token,
          token_type: type,
          expires_at: expiresAt,
          is_used: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, token };
    } catch (error) {
      console.error("Token.create error:", error);
      throw new Error(error.message || "Failed to create token");
    }
  }

  // Verify token
  static async verify(token, type) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await db
        .getAdminClient()
        .from("tokens")
        .select("*, users!inner(*)")
        .eq("token", token)
        .eq("token_type", type)
        .eq("is_used", false)
        .gt("expires_at", now)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Invalid or expired token");
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Token.verify error:", error);
      throw new Error(error.message || "Failed to verify token");
    }
  }

  // Mark token as used
  static async markAsUsed(tokenId) {
    try {
      const { error } = await db
        .getAdminClient()
        .from("tokens")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq("id", tokenId);

      if (error) throw error;
    } catch (error) {
      console.error("Token.markAsUsed error:", error);
      throw new Error(error.message || "Failed to update token");
    }
  }

  // Create email verification token (default 24h, configurable)
  static async createEmailVerification(userId, expiryMinutes = 24 * 60) {
    return await this.create({
      userId,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      expiryHours: expiryMinutes / 60,
    });
  }

  // Create password reset token
  static async createPasswordReset(userId) {
    return await this.create({
      userId,
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiryHours: 1,
    });
  }

  // Clean expired tokens
  static async cleanExpired() {
    try {
      const now = new Date().toISOString();

      const { error } = await db
        .getAdminClient()
        .from("tokens")
        .delete()
        .lt("expires_at", now);

      if (error) throw error;
    } catch (error) {
      console.error("Token.cleanExpired error:", error);
    }
  }
}

module.exports = Token;
