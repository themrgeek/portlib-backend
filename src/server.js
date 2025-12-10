const app = require("./app");
const db = require("./config/database");
const EmailService = require("./services/email.service");
const OTPService = require("./services/otp.service");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Check database connection
    const dbHealth = await db.healthCheck();
    if (!dbHealth.healthy) {
      console.error("❌ Database connection failed:", dbHealth.message);
      process.exit(1);
    }
    console.log("✅ Database connected successfully");

    // Verify email service
    const emailReady = await EmailService.verifyConnection();
    if (!emailReady) {
      console.warn("⚠️  Email service not configured properly");
    } else {
      console.log("✅ Email service ready");
    }

    // Cleanup OTPs on startup
    await OTPService.cleanup();
    console.log("✅ OTP cleanup completed");

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
            🚀 PortLib Server is running!
            
            Environment: ${process.env.NODE_ENV}
            Port: ${PORT}
            Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}
            
            📚 Features:
            - Student Registration with OTP
            - Email Verification
            - Password Reset
            - Rate Limiting
            - JWT Authentication
            
            📝 API Documentation: ${
              process.env.BASE_URL || `http://localhost:${PORT}`
            }/api-docs
            🔧 Health Check: ${
              process.env.BASE_URL || `http://localhost:${PORT}`
            }/api/auth/health
            `);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
