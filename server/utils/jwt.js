const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'crypto-wallet-app',
    audience: 'crypto-wallet-users'
  });
};

// Generate access token
const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'access'
  };
  return generateToken(payload);
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'refresh'
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'crypto-wallet-app',
    audience: 'crypto-wallet-users'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'crypto-wallet-app',
      audience: 'crypto-wallet-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Generate email verification token
const generateEmailVerificationToken = (email) => {
  const payload = {
    email,
    type: 'email_verification'
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'crypto-wallet-app'
  });
};

// Generate password reset token
const generatePasswordResetToken = (email) => {
  const payload = {
    email,
    type: 'password_reset'
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'crypto-wallet-app'
  });
};

// Extract token from authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  extractTokenFromHeader
};