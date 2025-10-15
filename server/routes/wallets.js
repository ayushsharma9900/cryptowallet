const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate, requireTwoFactor } = require('../middleware/auth');
const { 
  validateWalletCreation,
  validateWalletAddress,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

// Apply authentication to all wallet routes
router.use(authenticate);

// Get all wallets for user
router.get('/', 
  validatePagination,
  walletController.getWallets
);

// Get wallet by ID
router.get('/:id', 
  validateObjectId('id'),
  walletController.getWallet
);

// Create new wallet
router.post('/',
  validateWalletCreation,
  walletController.createWallet
);

// Update wallet
router.put('/:id',
  validateObjectId('id'),
  walletController.updateWallet
);

// Delete wallet (requires 2FA if enabled)
router.delete('/:id',
  validateObjectId('id'),
  requireTwoFactor,
  walletController.deleteWallet
);

// Get wallet balance
router.get('/:id/balance',
  validateObjectId('id'),
  walletController.getWalletBalance
);

// Get wallet transactions
router.get('/:id/transactions',
  validateObjectId('id'),
  validatePagination,
  walletController.getWalletTransactions
);

// Set primary wallet
router.patch('/:id/primary',
  validateObjectId('id'),
  walletController.setPrimaryWallet
);

// Validate wallet address
router.post('/validate-address',
  validateWalletAddress,
  walletController.validateWalletAddress
);

module.exports = router;