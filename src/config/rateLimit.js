require("dotenv").config();

module.exports = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
  skipSuccessfulRequests: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === "/health") return true;
    // Skip for certain IPs (optional)
    const trustedIPs = ["127.0.0.1", "::1"];
    return trustedIPs.includes(req.ip);
  },
};
