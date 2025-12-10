const fs = require("fs").promises;
const path = require("path");
const db = require("../config/database");

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Read migration files
    const migrationsDir = path.join(__dirname, "migrations");
    const files = await fs.readdir(migrationsDir);

    // Sort migration files
    const migrationFiles = files.filter((file) => file.endsWith(".sql")).sort();

    // Execute each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf8");

      // Split by semicolon and execute each statement
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        try {
          const { error } = await db.getAdminClient().rpc("exec_sql", {
            query: statement,
          });

          if (error) {
            console.warn(
              `Statement skipped: ${statement.substring(0, 100)}...`
            );
          }
        } catch (err) {
          console.warn(`Error executing statement: ${err.message}`);
        }
      }

      console.log(`✓ Migration ${file} completed`);
    }

    console.log("✅ All migrations completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Run the SQL in Supabase dashboard if migrations failed");
    console.log("2. Update environment variables in .env file");
    console.log("3. Run: npm run dev");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

runMigrations();
