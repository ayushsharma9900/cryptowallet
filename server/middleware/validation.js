const { body, param, query } = require('express-validator');

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('twoFactorToken')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Two-factor token must be 6 digits')
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid date of birth is required'),
  body('country')
    .optional()
    .isLength({ min: 2, max: 2 })
    .isAlpha()
    .withMessage('Country must be a valid 2-letter code'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'])
    .withMessage('Invalid language')
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

// Wallet creation validation
const validateWalletCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Wallet name is required and must be less than 100 characters'),
  body('cryptocurrency')
    .isIn(['BTC', 'ETH', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XRP', 'BNB', 'USDT', 'USDC'])
    .withMessage('Invalid cryptocurrency'),
  body('network')
    .optional()
    .isIn(['mainnet', 'testnet', 'sepolia', 'goerli', 'polygon', 'bsc'])
    .withMessage('Invalid network'),
  body('walletType')
    .optional()
    .isIn(['hot', 'cold', 'watch-only', 'multisig', 'hardware'])
    .withMessage('Invalid wallet type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// Wallet address validation
const validateWalletAddress = [
  body('address')
    .notEmpty()
    .trim()
    .withMessage('Wallet address is required')
    .custom((value, { req }) => {
      // Basic validation for different cryptocurrency addresses
      const crypto = req.body.cryptocurrency;
      
      switch (crypto) {
        case 'BTC':
          // Bitcoin address validation (simplified)
          if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(value)) {
            throw new Error('Invalid Bitcoin address');
          }
          break;
        case 'ETH':
        case 'USDT':
        case 'USDC':
        case 'LINK':
        case 'BNB':
          // Ethereum address validation
          if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
            throw new Error('Invalid Ethereum address');
          }
          break;
        // Add more validations for other cryptocurrencies
      }
      return true;
    })
];

// Transaction validation
const validateTransaction = [
  body('toAddress')
    .notEmpty()
    .trim()
    .withMessage('Recipient address is required'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('cryptocurrency')
    .isIn(['BTC', 'ETH', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XRP', 'BNB', 'USDT', 'USDC'])
    .withMessage('Invalid cryptocurrency'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('category')
    .optional()
    .isIn(['payment', 'transfer', 'trading', 'investment', 'fee', 'reward', 'other'])
    .withMessage('Invalid category')
];

// Contact validation
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('addresses')
    .isArray({ min: 1 })
    .withMessage('At least one address is required'),
  body('addresses.*.cryptocurrency')
    .isIn(['BTC', 'ETH', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XRP', 'BNB', 'USDT', 'USDC'])
    .withMessage('Invalid cryptocurrency'),
  body('addresses.*.address')
    .notEmpty()
    .trim()
    .withMessage('Address is required'),
  body('category')
    .optional()
    .isIn(['family', 'friend', 'business', 'service', 'exchange', 'other'])
    .withMessage('Invalid category')
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'amount', '-amount'])
    .withMessage('Invalid sort field')
];

// ID parameter validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`)
];

// Two-factor authentication validation
const validate2FA = [
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Token must be 6 digits')
];

// Search validation
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateWalletCreation,
  validateWalletAddress,
  validateTransaction,
  validateContact,
  validatePagination,
  validateObjectId,
  validate2FA,
  validateSearch
};