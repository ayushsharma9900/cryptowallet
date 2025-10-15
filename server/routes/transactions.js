const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { sendTransaction, getUserTransactions, getTransaction, getWalletTransactions } = require('../controllers/transactionController');

// Validation middleware
const validateSendTransaction = [
  body('fromWalletId')
    .notEmpty()
    .withMessage('Wallet ID is required')
    .isMongoId()
    .withMessage('Invalid wallet ID'),
  body('toAddress')
    .notEmpty()
    .withMessage('Recipient address is required')
    .trim()
    .isLength({ min: 26, max: 100 })
    .withMessage('Invalid address format'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

// @route   POST /api/transactions/send
// @desc    Send crypto transaction
// @access  Private
router.post('/send', auth, sendTransaction);

// @route   GET /api/transactions
// @desc    Get user transactions
// @access  Private
router.get('/', auth, getUserTransactions);

// @route   GET /api/transactions/:id
// @desc    Get specific transaction
// @access  Private
router.get('/:id', auth, getTransaction);

// @route   GET /api/transactions/wallet/:walletId
// @desc    Get wallet transactions
// @access  Private
router.get('/wallet/:walletId', auth, getWalletTransactions);

module.exports = router;