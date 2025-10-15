const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Identity
  transactionId: {
    type: String,
    unique: true,
    index: true,
    sparse: true // Allow null for pending transactions
  },
  internalId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Transaction Type
  type: {
    type: String,
    required: true,
    enum: ['send', 'receive', 'internal_transfer', 'exchange', 'staking', 'mining'],
    index: true
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Wallet Information
  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: function() { return this.type === 'send' || this.type === 'internal_transfer'; }
  },
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: function() { return this.type === 'receive' || this.type === 'internal_transfer'; }
  },
  
  // Address Information
  fromAddress: {
    type: String,
    required: true,
    index: true
  },
  toAddress: {
    type: String,
    required: true,
    index: true
  },
  
  // Amount Information
  amount: {
    type: String, // Using String to avoid precision issues
    required: true
  },
  cryptocurrency: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XRP', 'BNB', 'USDT', 'USDC'],
    index: true
  },
  network: {
    type: String,
    required: true,
    enum: ['mainnet', 'testnet', 'sepolia', 'goerli', 'polygon', 'bsc'],
    default: 'mainnet'
  },
  
  // USD Value (at time of transaction)
  amountUSD: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  
  // Fee Information
  fee: {
    type: String,
    default: '0'
  },
  feeUSD: {
    type: Number,
    default: 0
  },
  gasPrice: {
    type: String, // For Ethereum transactions
    default: null
  },
  gasUsed: {
    type: String, // For Ethereum transactions
    default: null
  },
  
  // Transaction Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'failed', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  confirmations: {
    type: Number,
    default: 0
  },
  requiredConfirmations: {
    type: Number,
    default: function() {
      const required = {
        BTC: 6,
        ETH: 12,
        LTC: 6,
        BCH: 6,
        ADA: 15,
        DOT: 1,
        LINK: 12,
        XRP: 1,
        BNB: 1,
        USDT: 12,
        USDC: 12
      };
      return required[this.cryptocurrency] || 6;
    }
  },
  
  // Blockchain Information
  blockNumber: {
    type: Number,
    default: null
  },
  blockHash: {
    type: String,
    default: null
  },
  
  // Transaction Details
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  category: {
    type: String,
    enum: ['payment', 'transfer', 'trading', 'investment', 'fee', 'reward', 'other'],
    default: 'payment'
  },
  
  // Recipients (for multi-output transactions)
  recipients: [{
    address: String,
    amount: String,
    amountUSD: Number
  }],
  
  // Contact Information (if sending to/from known contact)
  contact: {
    name: String,
    email: String,
    note: String
  },
  
  // Error Information
  errorMessage: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  broadcastAt: {
    type: Date,
    default: null
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Processing Information
  nonce: {
    type: Number,
    default: null
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  replaces: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ fromAddress: 1, createdAt: -1 });
transactionSchema.index({ toAddress: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ cryptocurrency: 1, createdAt: -1 });
transactionSchema.index({ type: 1, userId: 1, createdAt: -1 });

// Virtual for formatted amount
transactionSchema.virtual('amountFormatted').get(function() {
  const decimals = this.getDecimalPlaces();
  return (parseFloat(this.amount) / Math.pow(10, decimals)).toFixed(8);
});

// Virtual for formatted fee
transactionSchema.virtual('feeFormatted').get(function() {
  const decimals = this.getDecimalPlaces();
  return (parseFloat(this.fee) / Math.pow(10, decimals)).toFixed(8);
});

// Method to get decimal places for different cryptocurrencies
transactionSchema.methods.getDecimalPlaces = function() {
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
  return decimals[this.cryptocurrency] || 18;
};

// Method to update status
transactionSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  
  if (status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  
  if (status === 'confirmed' && this.confirmations >= this.requiredConfirmations && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (status === 'failed') {
    this.errorMessage = additionalData.errorMessage || 'Transaction failed';
    this.failureReason = additionalData.failureReason || 'Unknown';
  }
  
  Object.assign(this, additionalData);
  return this.save();
};

// Method to update confirmations
transactionSchema.methods.updateConfirmations = function(confirmations, blockNumber, blockHash) {
  this.confirmations = confirmations;
  
  if (blockNumber) this.blockNumber = blockNumber;
  if (blockHash) this.blockHash = blockHash;
  
  if (confirmations >= this.requiredConfirmations && this.status === 'confirmed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to check if transaction is complete
transactionSchema.methods.isComplete = function() {
  return this.status === 'confirmed' && this.confirmations >= this.requiredConfirmations;
};

// Method to check if transaction is expired
transactionSchema.methods.isExpired = function() {
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
  return this.status === 'pending' && (Date.now() - this.createdAt.getTime()) > expirationTime;
};

// Static method to find transactions by address
transactionSchema.statics.findByAddress = function(address, options = {}) {
  const query = {
    $or: [
      { fromAddress: address },
      { toAddress: address }
    ]
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

// Static method to get transaction stats for user
transactionSchema.statics.getUserStats = function(userId, period = '30d') {
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: { $in: ['confirmed', 'pending'] }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          cryptocurrency: '$cryptocurrency'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: { $toDouble: '$amount' } },
        totalAmountUSD: { $sum: '$amountUSD' }
      }
    }
  ]);
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Generate internal ID if not present
  if (!this.internalId) {
    this.internalId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);