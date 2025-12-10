const { ERRORS } = require("../utils/constants");

const errorHandler = {
  // Handle 404 errors
  notFound: (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  },

  // Global error handler
  globalError: (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
      });
    }

    // Determine error type
    let errorType = "server_error";
    let message = err.message || ERRORS.SERVER_ERROR;

    if (err.message.includes("validation")) {
      errorType = "validation_error";
      statusCode = 400;
    } else if (
      err.message.includes("Invalid") ||
      err.message.includes("expired")
    ) {
      errorType = "invalid_request";
      statusCode = 400;
    } else if (err.message.includes("not found")) {
      errorType = "not_found";
      statusCode = 404;
    } else if (
      err.message.includes("unauthorized") ||
      err.message.includes("permission")
    ) {
      errorType = "unauthorized";
      statusCode = 401;
    } else if (err.message.includes("rate limit")) {
      errorType = "rate_limit_exceeded";
      statusCode = 429;
    }

    res.status(statusCode).json({
      success: false,
      error: errorType,
      message: message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },

  // Async error handler wrapper
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },
};

module.exports = errorHandler;
