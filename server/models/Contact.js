const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Owner Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Contact Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    default: null
  },
  
  // Wallet Addresses
  addresses: [{
    cryptocurrency: {
      type: String,
      required: true,
      enum: ['BTC', 'ETH', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XRP', 'BNB', 'USDT', 'USDC']
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    network: {
      type: String,
      required: true,
      enum: ['mainnet', 'testnet', 'sepolia', 'goerli', 'polygon', 'bsc'],
      default: 'mainnet'
    },
    label: {
      type: String,
      trim: true,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contact Details
  avatar: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Tags and Categories
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['family', 'friend', 'business', 'service', 'exchange', 'other'],
    default: 'other'
  },
  
  // Interaction Stats
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalSent: {
    type: Number,
    default: 0
  },
  totalReceived: {
    type: Number,
    default: 0
  },
  lastTransactionAt: {
    type: Date,
    default: null
  },
  
  // Settings
  isFavorite: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Privacy
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, isFavorite: -1, name: 1 });
contactSchema.index({ userId: 1, category: 1, name: 1 });
contactSchema.index({ 'addresses.address': 1 });

// Virtual for display name
contactSchema.virtual('displayName').get(function() {
  return this.name || this.email || 'Unknown Contact';
});

// Method to add address
contactSchema.methods.addAddress = function(cryptocurrency, address, network = 'mainnet', label = '') {
  // Check if address already exists
  const existingAddress = this.addresses.find(addr => 
    addr.cryptocurrency === cryptocurrency && 
    addr.address === address && 
    addr.network === network
  );
  
  if (existingAddress) {
    throw new Error('Address already exists for this contact');
  }
  
  this.addresses.push({
    cryptocurrency,
    address,
    network,
    label,
    addedAt: new Date()
  });
  
  return this.save();
};

// Method to remove address
contactSchema.methods.removeAddress = function(addressId) {
  this.addresses = this.addresses.filter(addr => !addr._id.equals(addressId));
  return this.save();
};

// Method to update interaction stats
contactSchema.methods.updateStats = function(type, amount) {
  this.totalTransactions += 1;
  this.lastTransactionAt = new Date();
  
  if (type === 'sent') {
    this.totalSent += amount;
  } else if (type === 'received') {
    this.totalReceived += amount;
  }
  
  return this.save();
};

// Method to get address by cryptocurrency
contactSchema.methods.getAddress = function(cryptocurrency, network = 'mainnet') {
  return this.addresses.find(addr => 
    addr.cryptocurrency === cryptocurrency && 
    addr.network === network
  );
};

// Static method to find contact by address
contactSchema.statics.findByAddress = function(userId, address) {
  return this.findOne({
    userId,
    'addresses.address': address
  });
};

// Static method to search contacts
contactSchema.statics.search = function(userId, query, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    userId,
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { tags: { $in: [searchRegex] } }
    ]
  })
  .sort({ isFavorite: -1, name: 1 })
  .limit(options.limit || 50);
};

// Static method to get favorites
contactSchema.statics.getFavorites = function(userId) {
  return this.find({ userId, isFavorite: true })
    .sort({ name: 1 });
};

// Pre-save middleware
contactSchema.pre('save', function(next) {
  // Validate addresses
  for (let addr of this.addresses) {
    if (!addr.cryptocurrency || !addr.address) {
      return next(new Error('Address must have cryptocurrency and address fields'));
    }
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);