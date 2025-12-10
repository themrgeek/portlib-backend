const db = require("../config/database");

class StudentProfile {
  // Create student profile
  static async create(profileData) {
    const { userId, studentId, department, yearOfStudy } = profileData;

    try {
      const { data, error } = await db
        .getAdminClient()
        .from("student_profiles")
        .insert({
          user_id: userId,
          student_id: studentId,
          department,
          year_of_study: yearOfStudy,
          max_borrow_limit: 5,
          current_borrowed: 0,
          fine_amount: 0.0,
          tokens: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("StudentProfile.create error:", error);
      throw new Error(error.message || "Failed to create student profile");
    }
  }

  // Find by user ID
  static async findByUserId(userId) {
    try {
      const { data, error } = await db
        .getClient()
        .from("student_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("StudentProfile.findByUserId error:", error);
      throw error;
    }
  }

  // Find by student ID
  static async findByStudentId(studentId) {
    try {
      const { data, error } = await db
        .getClient()
        .from("student_profiles")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("StudentProfile.findByStudentId error:", error);
      throw error;
    }
  }

  // Update profile
  static async update(userId, updates) {
    try {
      updates.updated_at = new Date().toISOString();

      const { data, error } = await db
        .getAdminClient()
        .from("student_profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("StudentProfile.update error:", error);
      throw new Error(error.message || "Failed to update student profile");
    }
  }

  // Check if student ID exists
  static async studentIdExists(studentId) {
    const profile = await this.findByStudentId(studentId);
    return profile !== null;
  }
}

module.exports = StudentProfile;
