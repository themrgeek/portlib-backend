const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

class Database {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    // Create clients
    this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
    this.adminClient = createClient(this.supabaseUrl, this.supabaseServiceKey);
  }

  // Get public client
  getClient() {
    return this.client;
  }

  // Get admin client (for privileged operations)
  getAdminClient() {
    return this.adminClient;
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from("users")
        .select("count")
        .limit(1);
      return {
        healthy: !error,
        message: error
          ? "Database connection failed"
          : "Database connected successfully",
      };
    } catch (error) {
      return {
        healthy: false,
        message: error.message,
      };
    }
  }
}

module.exports = new Database();
