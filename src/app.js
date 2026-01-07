const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes and middleware
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middleware/errorHandler");
const rateLimitConfig = require("./config/rateLimit");
const bookRoutes = require("./routes/books.routes");
const borrowRoutes = require("./routes/borrow.routes");
const librarianRoutes = require("./routes/librarian.routes");
const adminRoutes = require("./routes/admin.routes");

// Initialize Express app
const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit(rateLimitConfig);
app.use(limiter);

// Request logging (skip favicon)
app.use((req, res, next) => {
  if (req.path !== "/favicon.ico") {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  }
  next();
});

// Handle favicon requests silently
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// API Routes
app.use("/api/auth", authRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "PortLib API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/api/auth/health",
  });
});

// API Documentation route
app.get("/api-docs", (req, res) => {
  res.json({
    endpoints: {
      auth: {
        register: "POST /api/auth/register/student",
        login_password: "POST /api/auth/login/password",
        login_otp_request: "POST /api/auth/login/otp/request",
        login_otp_verify: "POST /api/auth/login/otp/verify",
        verify_email: "GET /api/auth/verify-email/:token",
        password_reset_request: "POST /api/auth/password/reset/request",
        password_reset: "POST /api/auth/password/reset",
        refresh_token: "POST /api/auth/refresh-token",
        profile: "GET /api/auth/profile",
        change_password: "POST /api/auth/password/change",
        logout: "POST /api/auth/logout",
      },
      books: {
        list: "GET /api/books/available",
        search: "GET /api/books/search",
        add: "POST /api/books/add",
      },
      borrow: {
        borrow: "POST /api/borrow/borrow",
        current: "GET /api/borrow/current",
        history: "GET /api/borrow/history",
      },
      librarian: {
        pending_returns: "GET /api/librarian/pending-returns",
        overdue: "GET /api/librarian/overdue-books",
      },
      admin: {
        books: [
          "GET /api/admin/books",
          "POST /api/admin/books",
          "PATCH /api/admin/books/:bookId",
          "POST /api/admin/books/:bookId/archive",
          "POST /api/admin/books/:bookId/restore",
          "POST /api/admin/books/:bookId/copies/adjust",
        ],
        activities: [
          "GET /api/admin/activities/borrows",
          "GET /api/admin/activities/overdue",
          "GET /api/admin/activities/students/:studentId",
          "GET /api/admin/activities/reservations",
          "POST /api/admin/activities/reservations",
          "POST /api/admin/activities/reservations/:reservationId/cancel",
        ],
      },
    },
  });
});
// After existing routes, add:
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/librarian", librarianRoutes);
app.use("/api/admin", adminRoutes);
// 404 handler
app.use(errorHandler.notFound);

// Global error handler
app.use(errorHandler.globalError);

module.exports = app;
