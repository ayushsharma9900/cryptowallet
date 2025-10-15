const express = require('express');
const router = express.Router();
const ExchangeService = require('../services/ExchangeService');
const { authenticate } = require('../middleware/auth');

// Initialize exchange service
const exchangeService = new ExchangeService();

// All routes require authentication
router.use(authenticate);

// Get available exchanges
router.get('/available', (req, res) => {
  try {
    const exchanges = exchangeService.getAvailableExchanges();
    res.json({
      success: true,
      data: { exchanges }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get available exchanges',
      error: error.message
    });
  }
});

// Get user's connected exchanges
router.get('/connected', (req, res) => {
  try {
    const exchanges = exchangeService.getUserExchanges(req.user._id.toString());
    res.json({
      success: true,
      data: { exchanges }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get connected exchanges',
      error: error.message
    });
  }
});

// Connect to an exchange
router.post('/connect', async (req, res) => {
  try {
    const { exchangeName, credentials, label } = req.body;
    
    if (!exchangeName || !credentials) {
      return res.status(400).json({
        success: false,
        message: 'Exchange name and credentials are required'
      });
    }

    const result = await exchangeService.addUserExchange(
      req.user._id.toString(),
      exchangeName,
      credentials,
      label
    );

    res.json({
      success: true,
      message: 'Exchange connected successfully',
      data: { exchange: result }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to connect exchange',
      error: error.message
    });
  }
});

// Test exchange connection
router.post('/test/:exchangeKey', async (req, res) => {
  try {
    const { exchangeKey } = req.params;
    const result = await exchangeService.testConnection(req.user._id.toString(), exchangeKey);
    
    res.json({
      success: result.status === 'success',
      message: result.message,
      data: { status: result.status }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to test connection',
      error: error.message
    });
  }
});

// Disconnect from an exchange
router.delete('/disconnect/:exchangeKey', (req, res) => {
  try {
    const { exchangeKey } = req.params;
    const success = exchangeService.removeUserExchange(req.user._id.toString(), exchangeKey);
    
    if (success) {
      res.json({
        success: true,
        message: 'Exchange disconnected successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Exchange not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect exchange',
      error: error.message
    });
  }
});

// Get balances from all exchanges
router.get('/balances', async (req, res) => {
  try {
    const balances = await exchangeService.getAllBalances(req.user._id.toString());
    
    res.json({
      success: true,
      data: { balances }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get balances',
      error: error.message
    });
  }
});

// Get balances from specific exchange
router.get('/:exchangeKey/balances', async (req, res) => {
  try {
    const { exchangeKey } = req.params;
    const balances = await exchangeService.getBalances(req.user._id.toString(), exchangeKey);
    
    res.json({
      success: true,
      data: { balances }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get balances',
      error: error.message
    });
  }
});

// Get portfolio overview
router.get('/portfolio', async (req, res) => {
  try {
    const portfolio = await exchangeService.getPortfolioOverview(req.user._id.toString());
    
    res.json({
      success: true,
      data: { portfolio }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio overview',
      error: error.message
    });
  }
});

// Get ticker data
router.get('/:exchangeKey/ticker/:symbol', async (req, res) => {
  try {
    const { exchangeKey, symbol } = req.params;
    const ticker = await exchangeService.getTicker(req.user._id.toString(), exchangeKey, symbol);
    
    res.json({
      success: true,
      data: { ticker }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get ticker data',
      error: error.message
    });
  }
});

// Get order book
router.get('/:exchangeKey/orderbook/:symbol', async (req, res) => {
  try {
    const { exchangeKey, symbol } = req.params;
    const orderBook = await exchangeService.getOrderBook(req.user._id.toString(), exchangeKey, symbol);
    
    res.json({
      success: true,
      data: { orderBook }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get order book',
      error: error.message
    });
  }
});

// Create order
router.post('/:exchangeKey/orders', async (req, res) => {
  try {
    const { exchangeKey } = req.params;
    const orderData = req.body;
    
    const order = await exchangeService.createOrder(req.user._id.toString(), exchangeKey, orderData);
    
    res.json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order',
      error: error.message
    });
  }
});

// Get orders
router.get('/:exchangeKey/orders', async (req, res) => {
  try {
    const { exchangeKey } = req.params;
    const { symbol } = req.query;
    
    const orders = await exchangeService.getOrders(req.user._id.toString(), exchangeKey, symbol);
    
    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get orders',
      error: error.message
    });
  }
});

// Cancel order
router.delete('/:exchangeKey/orders/:orderId', async (req, res) => {
  try {
    const { exchangeKey, orderId } = req.params;
    const { symbol } = req.query;
    
    const success = await exchangeService.cancelOrder(req.user._id.toString(), exchangeKey, orderId, symbol);
    
    if (success) {
      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to cancel order'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order',
      error: error.message
    });
  }
});

// Get trade history
router.get('/:exchangeKey/trades', async (req, res) => {
  try {
    const { exchangeKey } = req.params;
    const { symbol, limit } = req.query;
    
    const trades = await exchangeService.getTrades(
      req.user._id.toString(), 
      exchangeKey, 
      symbol, 
      limit ? parseInt(limit) : 50
    );
    
    res.json({
      success: true,
      data: { trades }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get trade history',
      error: error.message
    });
  }
});

module.exports = router;