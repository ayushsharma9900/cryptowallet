const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, rateLimitSensitive } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateProfileUpdate,
  validatePasswordChange,
  validate2FA
} = require('../middleware/validation');

// Public routes
router.post('/register', 
  rateLimitSensitive(5, 60000), // 5 attempts per minute
  validateRegistration, 
  authController.register
);

router.post('/login', 
  rateLimitSensitive(5, 60000), // 5 attempts per minute
  validateLogin, 
  authController.login
);

router.post('/refresh-token', 
  rateLimitSensitive(10, 60000), // 10 attempts per minute
  authController.refreshToken
);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', authController.logout);

router.get('/profile', authController.getProfile);

router.put('/profile', 
  validateProfileUpdate, 
  authController.updateProfile
);

router.put('/change-password',
  rateLimitSensitive(3, 300000), // 3 attempts per 5 minutes
  validatePasswordChange,
  authController.changePassword
);

// Two-Factor Authentication routes
router.post('/2fa/setup', authController.setup2FA);

router.post('/2fa/verify',
  validate2FA,
  authController.verify2FA
);

router.post('/2fa/disable',
  rateLimitSensitive(3, 300000), // 3 attempts per 5 minutes
  validate2FA,
  authController.disable2FA
);

module.exports = router;