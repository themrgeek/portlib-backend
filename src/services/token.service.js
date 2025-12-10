const jwt = require("jsonwebtoken");
const { TIME } = require("../utils/constants");

class TokenService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  }

  // Generate access token
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.is_verified,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: TIME.ACCESS_TOKEN_EXPIRY,
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: TIME.REFRESH_TOKEN_EXPIRY,
    });
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret);
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret);
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  // Generate tokens pair
  generateTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry: Date.now() + TIME.ACCESS_TOKEN_EXPIRY * 1000,
      refreshTokenExpiry: Date.now() + TIME.REFRESH_TOKEN_EXPIRY * 1000,
    };
  }

  // Decode token without verification
  decodeToken(token) {
    return jwt.decode(token);
  }

  // Check if token is about to expire
  isTokenExpiringSoon(token, thresholdMinutes = 5) {
    try {
      const decoded = this.verifyAccessToken(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      return expiresIn < thresholdMinutes * 60 * 1000;
    } catch (error) {
      return true;
    }
  }
}

module.exports = new TokenService();
