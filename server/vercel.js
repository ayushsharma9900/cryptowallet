const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallets');
const exchangeRoutes = require('./routes/exchanges');

// Import middleware
const { optionalAuth } = require('./middleware/auth');

// Create Express app
const app = express();

// Connect to MongoDB (for serverless, we need to handle connection differently)
let isConnected = false;

const connectToDatabase = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// CORS configuration for Vercel
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'https://cryptowallet-app.vercel.app', 
      'https://cryptowallet.vercel.app',
      'https://cryptowallet-git-main.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true
}));

// Rate limiting - adjusted for serverless
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to database before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// Optional authentication for all routes
app.use(optionalAuth);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Wallet API is running on Vercel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/exchanges', exchangeRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Wallet API Documentation',
    version: '1.0.0',
    deployment: 'Vercel Serverless',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'POST /api/auth/refresh-token': 'Refresh access token',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'PUT /api/auth/change-password': 'Change password',
        'POST /api/auth/2fa/setup': 'Setup 2FA',
        'POST /api/auth/2fa/verify': 'Verify and enable 2FA',
        'POST /api/auth/2fa/disable': 'Disable 2FA'
      },
      wallets: {
        'GET /api/wallets': 'Get user wallets',
        'GET /api/wallets/:id': 'Get specific wallet',
        'POST /api/wallets': 'Create new wallet',
        'PUT /api/wallets/:id': 'Update wallet',
        'DELETE /api/wallets/:id': 'Delete wallet',
        'GET /api/wallets/:id/balance': 'Get wallet balance',
        'GET /api/wallets/:id/transactions': 'Get wallet transactions',
        'PATCH /api/wallets/:id/primary': 'Set primary wallet',
        'POST /api/wallets/validate-address': 'Validate crypto address'
      },
      exchanges: {
        'GET /api/exchanges/available': 'Get available exchanges',
        'GET /api/exchanges/connected': 'Get connected exchanges',
        'POST /api/exchanges/connect': 'Connect to exchange',
        'DELETE /api/exchanges/disconnect/:key': 'Disconnect exchange',
        'POST /api/exchanges/test/:key': 'Test exchange connection',
        'GET /api/exchanges/balances': 'Get all exchange balances',
        'GET /api/exchanges/:key/balances': 'Get specific exchange balances',
        'GET /api/exchanges/portfolio': 'Get portfolio overview',
        'GET /api/exchanges/:key/ticker/:symbol': 'Get ticker data',
        'GET /api/exchanges/:key/orderbook/:symbol': 'Get order book',
        'POST /api/exchanges/:key/orders': 'Create order',
        'GET /api/exchanges/:key/orders': 'Get orders',
        'DELETE /api/exchanges/:key/orders/:id': 'Cancel order',
        'GET /api/exchanges/:key/trades': 'Get trade history'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate entry';
  } else if (error.message) {
    message = error.message;
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

module.exports = app;
