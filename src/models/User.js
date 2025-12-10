const db = require("../config/database");
const Helpers = require("../utils/helpers");
const { ROLES, STATUS } = require("../utils/constants");

class User {
  // Create a new user
  static async create(userData) {
    const { email, phone, password, fullName, role = ROLES.STUDENT } = userData;

    try {
      // Hash password
      const passwordHash = await Helpers.hashPassword(password);

      const { data, error } = await db
        .getAdminClient()
        .from("users")
        .insert({
          email,
          phone: Helpers.formatPhoneNumber(phone),
          password_hash: passwordHash,
          full_name: fullName,
          role,
          status: STATUS.ACTIVE,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("User.create error:", error);
      throw new Error(error.message || "Failed to create user");
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const { data, error } = await db
        .getClient()
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("User.findByEmail error:", error);
      throw error;
    }
  }

  // Find user by phone
  static async findByPhone(phone) {
    try {
      const { data, error } = await db
        .getClient()
        .from("users")
        .select("*")
        .eq("phone", Helpers.formatPhoneNumber(phone))
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("User.findByPhone error:", error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const { data, error } = await db
        .getClient()
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("User.findById error:", error);
      throw error;
    }
  }

  // Update user
  static async update(id, updates) {
    try {
      updates.updated_at = new Date().toISOString();

      const { data, error } = await db
        .getAdminClient()
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("User.update error:", error);
      throw new Error(error.message || "Failed to update user");
    }
  }

  // Update verification status
  static async verifyEmail(id) {
    return await this.update(id, {
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const passwordHash = await Helpers.hashPassword(newPassword);
    return await this.update(id, { password_hash: passwordHash });
  }

  // Delete user (cascades to student profile via FK)
  static async deleteById(id) {
    try {
      const { error } = await db
        .getAdminClient()
        .from("users")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("User.deleteById error:", error);
      throw new Error(error.message || "Failed to delete user");
    }
  }

  // Check if email exists
  static async emailExists(email) {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  // Check if phone exists
  static async phoneExists(phone) {
    const user = await this.findByPhone(phone);
    return user !== null;
  }

  // Get user with profile
  static async getUserWithProfile(id) {
    try {
      const { data, error } = await db
        .getClient()
        .from("users")
        .select(
          `
                    *,
                    student_profiles (*)
                `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("User.getUserWithProfile error:", error);
      throw error;
    }
  }
}

module.exports = User;
