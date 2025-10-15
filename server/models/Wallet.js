const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // Owner Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Wallet Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  
  // Cryptocurrency Information
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
  
  // Wallet Address Information
  address: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  publicKey: {
    type: String,
    required: false // Some wallets might not store public key
  },
  
  // Encrypted Private Key (for hot wallets)
  encryptedPrivateKey: {
    type: String,
    required: false // Only for wallets managed by the app
  },
  
  // Wallet Type
  walletType: {
    type: String,
    required: true,
    enum: ['hot', 'cold', 'watch-only', 'multisig', 'hardware'],
    default: 'hot'
  },
  
  // Balance Information
  balance: {
    type: String, // Using String to avoid precision issues with decimals
    default: '0'
  },
  balanceUSD: {
    type: Number,
    default: 0
  },
  lastBalanceUpdate: {
    type: Date,
    default: Date.now
  },
  
  // Wallet Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  
  // Security Settings
  requiresPassword: {
    type: Boolean,
    default: false
  },
  transactionLimit: {
    daily: {
      type: Number,
      default: 10000 // USD
    },
    monthly: {
      type: Number,
      default: 50000 // USD
    }
  },
  
  // Multisig Settings (for multisig wallets)
  multisig: {
    required: {
      type: Number,
      default: 1
    },
    total: {
      type: Number,
      default: 1
    },
    cosigners: [{
      address: String,
      publicKey: String,
      name: String
    }]
  },
  
  // Derivation Path (for HD wallets)
  derivationPath: {
    type: String,
    default: null
  },
  
  // Import Information
  importedFrom: {
    type: String,
    enum: ['generated', 'imported', 'hardware', 'mnemonic'],
    default: 'generated'
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.encryptedPrivateKey;
      delete ret.multisig.cosigners;
      return ret;
    }
  }
});

// Indexes
walletSchema.index({ userId: 1, cryptocurrency: 1 });
walletSchema.index({ address: 1 });
walletSchema.index({ userId: 1, isPrimary: 1 });
walletSchema.index({ createdAt: -1 });

// Virtual for balance in crypto units
walletSchema.virtual('balanceFormatted').get(function() {
  const decimals = this.getDecimalPlaces();
  return (parseFloat(this.balance) / Math.pow(10, decimals)).toFixed(8);
});

// Method to get decimal places for different cryptocurrencies
walletSchema.methods.getDecimalPlaces = function() {
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

// Method to update balance
walletSchema.methods.updateBalance = function(newBalance, usdValue) {
  this.balance = newBalance;
  this.balanceUSD = usdValue || 0;
  this.lastBalanceUpdate = new Date();
  return this.save();
};

// Static method to find user's primary wallet for a cryptocurrency
walletSchema.statics.findPrimary = function(userId, cryptocurrency) {
  return this.findOne({ 
    userId, 
    cryptocurrency, 
    isPrimary: true, 
    isActive: true 
  });
};

// Pre-save middleware
walletSchema.pre('save', async function(next) {
  // Ensure only one primary wallet per cryptocurrency per user
  if (this.isPrimary && this.isModified('isPrimary')) {
    await this.constructor.updateMany(
      { 
        userId: this.userId, 
        cryptocurrency: this.cryptocurrency, 
        _id: { $ne: this._id } 
      },
      { isPrimary: false }
    );
  }
  next();
});

module.exports = mongoose.model('Wallet', walletSchema);