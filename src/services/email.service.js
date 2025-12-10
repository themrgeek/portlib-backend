const nodemailer = require("nodemailer");
const emailConfig = require("../config/email");
const Helpers = require("../utils/helpers");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  // Send verification email (accepts custom expiry minutes for message copy)
  async sendVerificationEmail(
    email,
    token,
    userName,
    expiresInMinutes = 24 * 60
  ) {
    const verificationLink = Helpers.generateVerificationLink(token, "email");

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email - PortLib</title>
                <style>
                    /* Your email styles here */
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to PortLib!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${userName},</h2>
                        <p>Thank you for registering with PortLib. Please verify your email address by clicking the button below:</p>
                        <p class="button-container">
                            <a href="${verificationLink}" class="button">Verify Email Address</a>
                        </p>
                        <p>Or copy and paste this link in your browser:</p>
                        <p class="link">${verificationLink}</p>
                        <p>This verification link will expire in ${expiresInMinutes} minutes.</p>
                        <p>If you didn't create an account with PortLib, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} PortLib Library Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: emailConfig.templates.verification.subject,
      html: html,
      text: `Please verify your email by clicking: ${verificationLink}`,
    };

    return await this.sendMail(mailOptions);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token, userName) {
    const resetLink = Helpers.generateVerificationLink(token, "password");

    const html = `
            <!DOCTYPE html>
            <html>
            <!-- Similar template structure -->
            </html>
        `;

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: emailConfig.templates.passwordReset.subject,
      html: html,
      text: `Reset your password: ${resetLink}`,
    };

    return await this.sendMail(mailOptions);
  }

  // Send welcome email
  async sendWelcomeEmail(email, userName) {
    const html = `
            <!DOCTYPE html>
            <html>
            <!-- Welcome email template -->
            </html>
        `;

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: emailConfig.templates.welcome.subject,
      html: html,
      text: `Welcome to PortLib, ${userName}!`,
    };

    return await this.sendMail(mailOptions);
  }

  // Generic mail sending method
  async sendMail(mailOptions) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email send error:", error);
      throw new Error("Failed to send email");
    }
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("Email server is ready to send messages");
      return true;
    } catch (error) {
      console.error("Email server connection error:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
