require("dotenv").config();

module.exports = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.EMAIL_FROM || "noreply@portlib.com",
  templates: {
    verification: {
      subject: "Verify Your PortLib Account",
      expiryHours: 24,
    },
    passwordReset: {
      subject: "Reset Your PortLib Password",
      expiryHours: 1,
    },
    welcome: {
      subject: "Welcome to PortLib!",
    },
  },
};
