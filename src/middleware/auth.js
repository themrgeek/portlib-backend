const TokenService = require("../services/token.service");
const { ERRORS } = require("../utils/constants");

const authMiddleware = {
  // Verify access token
  authenticate: (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: ERRORS.UNAUTHORIZED,
          message: "Access token is required",
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = TokenService.verifyAccessToken(token);

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: ERRORS.UNAUTHORIZED,
        message: "Invalid or expired access token",
      });
    }
  },

  // Require specific role
  requireRole: (...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: ERRORS.FORBIDDEN,
          message: "Insufficient permissions",
        });
      }
      next();
    };
  },

  // Require email verification
  requireVerified: (req, res, next) => {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        error: ERRORS.FORBIDDEN,
        message: "Email verification required",
      });
    }
    next();
  },

  // Optional authentication
  optionalAuth: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = TokenService.verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we still proceed
        req.user = null;
      }
    }
    next();
  },
};

module.exports = authMiddleware;
