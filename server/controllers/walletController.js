const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const { 
  generateBitcoinWallet,
  generateEthereumWallet,
  validateAddress,
  encrypt,
  decrypt,
  getAddressInfo
} = require('../utils/crypto');

// Get all wallets for user
const getWallets = async (req, res) => {
  try {
    const { page = 1, limit = 20, cryptocurrency } = req.query;
    
    const query = { userId: req.user._id, isActive: true };
    if (cryptocurrency) {
      query.cryptocurrency = cryptocurrency;
    }
    
    const wallets = await Wallet.find(query)
      .sort({ isPrimary: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'firstName lastName email');
      
    const total = await Wallet.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        wallets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallets'
    });
  }
};

// Get wallet by ID
const getWallet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const wallet = await Wallet.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    }).populate('userId', 'firstName lastName email');
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet'
    });
  }
};

// Create new wallet
const createWallet = async (req, res) => {
  try {
    console.log('🔧 Starting wallet creation...');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { 
      name, 
      cryptocurrency, 
      network = 'mainnet', 
      walletType = 'hot', 
      description,
      address, // For imported/watch-only wallets
      privateKey, // For imported wallets
      isPrimary = false
    } = req.body;
    
    let walletData = {};
    
    if (walletType === 'watch-only' && address) {
      // Import watch-only wallet
      if (!validateAddress(address, cryptocurrency, network)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet address for the specified cryptocurrency'
        });
      }
      
      walletData = {
        address,
        walletType: 'watch-only'
      };
    } else if (walletType === 'hot' && privateKey) {
      // Import hot wallet with private key
      walletData = {
        address,
        encryptedPrivateKey: JSON.stringify(encrypt(privateKey)),
        walletType: 'hot',
        importedFrom: 'imported'
      };
    } else {
      // Generate new hot wallet
      console.log('🔄 Generating new', cryptocurrency, 'wallet...');
      let generatedWallet;
      
      switch (cryptocurrency) {
        case 'BTC':
        case 'LTC':
        case 'BCH':
          console.log('₿ Generating Bitcoin wallet...');
          generatedWallet = generateBitcoinWallet(network);
          break;
        case 'ETH':
        case 'USDT':
        case 'USDC':
        case 'LINK':
        case 'BNB':
          console.log('Ξ Generating Ethereum wallet...');
          generatedWallet = generateEthereumWallet(network);
          break;
        default:
          console.log('❌ Unsupported cryptocurrency:', cryptocurrency);
          return res.status(400).json({
            success: false,
            message: `Unsupported cryptocurrency: ${cryptocurrency}`
          });
      }
      
      console.log('✅ Wallet generated. Address:', generatedWallet.address);
      console.log('🔐 Encrypting private key...');
      
      const encryptedPrivateKey = encrypt(generatedWallet.privateKey);
      console.log('✅ Private key encrypted');
      
      walletData = {
        address: generatedWallet.address,
        publicKey: generatedWallet.publicKey,
        encryptedPrivateKey: JSON.stringify(encryptedPrivateKey),
        walletType: 'hot',
        importedFrom: 'generated'
      };
    }
    
    console.log('🏦 Creating wallet object...');
    const wallet = new Wallet({
      userId: req.user._id,
      name,
      description,
      cryptocurrency,
      network,
      isPrimary,
      ...walletData
    });
    
    console.log('💾 Saving wallet to database...');
    await wallet.save();
    console.log('✅ Wallet saved successfully!');
    
    // Remove sensitive data from response
    const responseWallet = wallet.toJSON();
    
    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: { wallet: responseWallet }
    });
    
  } catch (error) {
    console.error('Create wallet error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create wallet'
    });
  }
};

// Update wallet
const updateWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const allowedFields = [
      'name',
      'description',
      'isPrimary',
      'transactionLimit',
      'tags',
      'notes'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const wallet = await Wallet.findOneAndUpdate(
      { _id: id, userId: req.user._id, isActive: true },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Wallet updated successfully',
      data: { wallet }
    });
    
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet'
    });
  }
};

// Delete wallet (soft delete)
const deleteWallet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const wallet = await Wallet.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Check if wallet has balance (in a real app, you'd check the actual balance)
    if (parseFloat(wallet.balance) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete wallet with non-zero balance'
      });
    }
    
    // Check for pending transactions
    const pendingTransactions = await Transaction.countDocuments({
      $or: [
        { fromWallet: id },
        { toWallet: id }
      ],
      status: 'pending'
    });
    
    if (pendingTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete wallet with pending transactions'
      });
    }
    
    // Soft delete
    wallet.isActive = false;
    wallet.isPrimary = false;
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Wallet deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete wallet'
    });
  }
};

// Get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const wallet = await Wallet.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // In a real application, you would query the blockchain for the actual balance
    // For demo purposes, we'll return the stored balance
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        balanceFormatted: wallet.balanceFormatted,
        balanceUSD: wallet.balanceUSD,
        lastUpdate: wallet.lastBalanceUpdate,
        address: wallet.address,
        cryptocurrency: wallet.cryptocurrency
      }
    });
    
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance'
    });
  }
};

// Validate wallet address
const validateWalletAddress = async (req, res) => {
  try {
    const { address, cryptocurrency, network = 'mainnet' } = req.body;
    
    if (!address || !cryptocurrency) {
      return res.status(400).json({
        success: false,
        message: 'Address and cryptocurrency are required'
      });
    }
    
    const addressInfo = getAddressInfo(address, cryptocurrency);
    
    res.json({
      success: true,
      data: {
        isValid: addressInfo.isValid,
        address,
        cryptocurrency,
        network,
        ...addressInfo
      }
    });
    
  } catch (error) {
    console.error('Validate address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address'
    });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type, status } = req.query;
    
    const wallet = await Wallet.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    const query = {
      $or: [
        { fromWallet: id },
        { toWallet: id }
      ]
    };
    
    if (type) query.type = type;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('fromWallet', 'name address')
      .populate('toWallet', 'name address');
      
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet transactions'
    });
  }
};

// Set primary wallet
const setPrimaryWallet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const wallet = await Wallet.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Update all user's wallets of this cryptocurrency to not be primary
    await Wallet.updateMany(
      { 
        userId: req.user._id,
        cryptocurrency: wallet.cryptocurrency,
        _id: { $ne: id }
      },
      { isPrimary: false }
    );
    
    // Set this wallet as primary
    wallet.isPrimary = true;
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Primary wallet set successfully',
      data: { wallet }
    });
    
  } catch (error) {
    console.error('Set primary wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary wallet'
    });
  }
};

module.exports = {
  getWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletBalance,
  validateWalletAddress,
  getWalletTransactions,
  setPrimaryWallet
};