const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const crypto = require('crypto');

// @desc    Send crypto transaction
// @route   POST /api/transactions/send
// @access  Private
const sendTransaction = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fromWalletId, toAddress, amount, note } = req.body;
    const userId = req.user.id;

    // Find the source wallet
    const fromWallet = await Wallet.findOne({
      _id: fromWalletId,
      user: userId
    });

    if (!fromWallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check if user has sufficient balance
    const currentBalance = parseFloat(fromWallet.balance) / Math.pow(10, getDecimalPlaces(fromWallet.cryptocurrency));
    if (parseFloat(amount) > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${currentBalance} ${fromWallet.cryptocurrency}`
      });
    }

    // Validate recipient address format (basic validation)
    if (!isValidAddress(toAddress, fromWallet.cryptocurrency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient address format'
      });
    }

    // Generate mock transaction hash
    const txHash = generateTxHash();

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      fromWallet: fromWalletId,
      toAddress,
      amount: amount.toString(),
      cryptocurrency: fromWallet.cryptocurrency,
      txHash,
      status: 'confirmed', // In real app, this would be 'pending' initially
      note: note || undefined,
      networkFee: calculateNetworkFee(fromWallet.cryptocurrency),
      blockNumber: Math.floor(Math.random() * 1000000) + 800000, // Mock block number
      confirmations: 6 // Mock confirmations
    });

    await transaction.save();

    // Update wallet balance (subtract sent amount)
    const amountInWei = (parseFloat(amount) * Math.pow(10, getDecimalPlaces(fromWallet.cryptocurrency))).toString();
    const newBalance = (parseFloat(fromWallet.balance) - parseFloat(amountInWei)).toString();
    
    await Wallet.findByIdAndUpdate(fromWalletId, {
      balance: newBalance,
      lastActivity: new Date()
    });

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('transaction-update', {
        type: 'sent',
        transaction: {
          id: transaction._id,
          txHash: transaction.txHash,
          amount: transaction.amount,
          cryptocurrency: transaction.cryptocurrency,
          status: transaction.status
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transaction sent successfully',
      data: {
        transaction: {
          id: transaction._id,
          txHash: transaction.txHash,
          fromWallet: fromWalletId,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          cryptocurrency: transaction.cryptocurrency,
          status: transaction.status,
          networkFee: transaction.networkFee,
          blockNumber: transaction.blockNumber,
          confirmations: transaction.confirmations,
          note: transaction.note,
          createdAt: transaction.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Send transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while sending transaction'
    });
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ user: userId })
      .populate('fromWallet', 'name cryptocurrency address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching transactions'
    });
  }
};

// @desc    Get specific transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId
    }).populate('fromWallet', 'name cryptocurrency address');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: {
        transaction
      }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching transaction'
    });
  }
};

// @desc    Get wallet transactions
// @route   GET /api/transactions/wallet/:walletId
// @access  Private
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = req.params.walletId;

    // Verify wallet belongs to user
    const wallet = await Wallet.findOne({
      _id: walletId,
      user: userId
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const transactions = await Transaction.find({
      fromWallet: walletId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        transactions
      }
    });

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching wallet transactions'
    });
  }
};

// Helper functions
function getDecimalPlaces(cryptocurrency) {
  const decimals = {
    BTC: 8,
    ETH: 18,
    LTC: 8,
    BCH: 8,
    ADA: 6,
    DOT: 10,
    LINK: 18,
    XRP: 6,
    BNB: 18,
    USDT: 6,
    USDC: 6
  };
  return decimals[cryptocurrency] || 18;
}

function isValidAddress(address, cryptocurrency) {
  // Basic address validation - in production, use proper crypto libraries
  const patterns = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
    BCH: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bitcoincash:[a-z0-9]{42}$/,
    ADA: /^addr1[a-zA-Z0-9]{98}$/,
    DOT: /^[1-9A-HJ-NP-Za-km-z]{47,48}$/,
    LINK: /^0x[a-fA-F0-9]{40}$/,
    XRP: /^r[a-zA-Z0-9]{24,34}$/,
    BNB: /^0x[a-fA-F0-9]{40}$|^bnb[a-zA-Z0-9]{38}$/,
    USDT: /^0x[a-fA-F0-9]{40}$/,
    USDC: /^0x[a-fA-F0-9]{40}$/
  };
  
  const pattern = patterns[cryptocurrency];
  return pattern ? pattern.test(address) : true; // Default to true for unknown cryptos
}

function generateTxHash() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function calculateNetworkFee(cryptocurrency) {
  // Mock network fees - in production, get real-time fees
  const fees = {
    BTC: '0.0001',
    ETH: '0.002',
    LTC: '0.001',
    BCH: '0.0001',
    ADA: '0.17',
    DOT: '0.1',
    LINK: '0.002',
    XRP: '0.00001',
    BNB: '0.001',
    USDT: '1',
    USDC: '1'
  };
  return fees[cryptocurrency] || '0.001';
}

module.exports = {
  sendTransaction,
  getUserTransactions,
  getTransaction,
  getWalletTransactions
};