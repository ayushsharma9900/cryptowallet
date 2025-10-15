const CoinbaseExchange = require('./exchanges/CoinbaseExchange');
const BinanceExchange = require('./exchanges/BinanceExchange');
const KrakenExchange = require('./exchanges/KrakenExchange');
const KuCoinExchange = require('./exchanges/KuCoinExchange');
const { encryptData, decryptData } = require('../utils/crypto');

class ExchangeService {
  constructor() {
    this.exchanges = new Map();
    this.userExchanges = new Map(); // userId -> Map<exchangeName, exchangeInstance>
    
    // Initialize exchange classes
    this.exchangeClasses = {
      coinbase: CoinbaseExchange,
      binance: BinanceExchange,
      kraken: KrakenExchange,
      kucoin: KuCoinExchange
    };

    // Rate limiting
    this.rateLimits = new Map();
    this.requestCounts = new Map();
  }

  // Get available exchanges
  getAvailableExchanges() {
    return [
      {
        name: 'coinbase',
        displayName: 'Coinbase Advanced Trade',
        description: 'Professional trading platform by Coinbase',
        supportedFeatures: ['spot', 'portfolio', 'advanced_orders'],
        requiredCredentials: ['apiKey', 'secretKey', 'passphrase']
      },
      {
        name: 'binance',
        displayName: 'Binance',
        description: 'World\'s largest cryptocurrency exchange',
        supportedFeatures: ['spot', 'margin', 'futures', 'portfolio'],
        requiredCredentials: ['apiKey', 'secretKey']
      },
      {
        name: 'kraken',
        displayName: 'Kraken',
        description: 'Secure and compliant digital asset exchange',
        supportedFeatures: ['spot', 'margin', 'futures'],
        requiredCredentials: ['apiKey', 'secretKey']
      },
      {
        name: 'kucoin',
        displayName: 'KuCoin',
        description: 'Global cryptocurrency exchange',
        supportedFeatures: ['spot', 'margin', 'futures'],
        requiredCredentials: ['apiKey', 'secretKey', 'passphrase']
      }
    ];
  }

  // Add exchange for user
  async addUserExchange(userId, exchangeName, credentials, label = null) {
    if (!this.exchangeClasses[exchangeName]) {
      throw new Error(`Unsupported exchange: ${exchangeName}`);
    }

    // Encrypt credentials
    const encryptedCredentials = {
      apiKey: encryptData(credentials.apiKey),
      secretKey: encryptData(credentials.secretKey),
      ...(credentials.passphrase && { passphrase: encryptData(credentials.passphrase) }),
      ...(credentials.sandbox && { sandbox: credentials.sandbox })
    };

    // Store in database (you'll need to implement this)
    // await this.storeUserExchange(userId, exchangeName, encryptedCredentials, label);

    // Initialize exchange instance
    const ExchangeClass = this.exchangeClasses[exchangeName];
    const exchangeInstance = new ExchangeClass();
    
    // Decrypt and set credentials
    const decryptedCredentials = {
      apiKey: decryptData(encryptedCredentials.apiKey),
      secretKey: decryptData(encryptedCredentials.secretKey),
      ...(encryptedCredentials.passphrase && { 
        passphrase: decryptData(encryptedCredentials.passphrase) 
      }),
      ...(encryptedCredentials.sandbox && { sandbox: encryptedCredentials.sandbox })
    };

    exchangeInstance.setCredentials(decryptedCredentials);

    // Store in memory
    if (!this.userExchanges.has(userId)) {
      this.userExchanges.set(userId, new Map());
    }
    
    const userExchangeKey = label ? `${exchangeName}_${label}` : exchangeName;
    this.userExchanges.get(userId).set(userExchangeKey, exchangeInstance);

    return {
      id: userExchangeKey,
      exchangeName,
      label,
      status: 'connected',
      addedAt: new Date().toISOString()
    };
  }

  // Get user exchange instance
  getUserExchange(userId, exchangeKey) {
    const userExchanges = this.userExchanges.get(userId);
    if (!userExchanges) {
      throw new Error('No exchanges configured for user');
    }

    const exchange = userExchanges.get(exchangeKey);
    if (!exchange) {
      throw new Error(`Exchange ${exchangeKey} not found for user`);
    }

    return exchange;
  }

  // Get all user exchanges
  getUserExchanges(userId) {
    const userExchanges = this.userExchanges.get(userId);
    if (!userExchanges) return [];

    return Array.from(userExchanges.entries()).map(([key, exchange]) => ({
      id: key,
      name: exchange.name,
      label: key.includes('_') ? key.split('_')[1] : null,
      status: 'connected'
    }));
  }

  // Remove user exchange
  removeUserExchange(userId, exchangeKey) {
    const userExchanges = this.userExchanges.get(userId);
    if (userExchanges) {
      userExchanges.delete(exchangeKey);
      // Also remove from database
      // await this.removeUserExchangeFromDB(userId, exchangeKey);
      return true;
    }
    return false;
  }

  // Rate limiting check
  checkRateLimit(userId, exchangeName) {
    const key = `${userId}_${exchangeName}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }

    const requests = this.requestCounts.get(key);
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${exchangeName}. Try again in ${Math.ceil((validRequests[0] + windowMs - now) / 1000)} seconds.`);
    }

    validRequests.push(now);
    this.requestCounts.set(key, validRequests);
  }

  // Unified methods for all exchanges
  async getBalances(userId, exchangeKey) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    return await exchange.getBalances();
  }

  async getTicker(userId, exchangeKey, symbol) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    return await exchange.getTicker(symbol);
  }

  async getOrderBook(userId, exchangeKey, symbol) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    return await exchange.getOrderBook(symbol);
  }

  async createOrder(userId, exchangeKey, orderData) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    return await exchange.createOrder(orderData);
  }

  async cancelOrder(userId, exchangeKey, orderId, symbol = null) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    
    // Some exchanges require symbol for cancellation
    if (exchange.name === 'binance' || exchange.name === 'kucoin') {
      return await exchange.cancelOrder(orderId, symbol);
    }
    return await exchange.cancelOrder(orderId);
  }

  async getOrders(userId, exchangeKey, symbol = null) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    return await exchange.getOrders(symbol);
  }

  async getTrades(userId, exchangeKey, symbol = null, limit = 50) {
    this.checkRateLimit(userId, exchangeKey);
    const exchange = this.getUserExchange(userId, exchangeKey);
    return await exchange.getTrades(symbol, limit);
  }

  // Aggregate data from all user exchanges
  async getAllBalances(userId) {
    const userExchanges = this.userExchanges.get(userId);
    if (!userExchanges) return [];

    const allBalances = [];
    
    for (const [exchangeKey, exchange] of userExchanges.entries()) {
      try {
        const balances = await this.getBalances(userId, exchangeKey);
        allBalances.push(...balances.map(balance => ({
          ...balance,
          exchange: exchangeKey,
          exchangeName: exchange.name
        })));
      } catch (error) {
        console.error(`Error fetching balances from ${exchangeKey}:`, error.message);
      }
    }

    return allBalances;
  }

  // Get portfolio overview
  async getPortfolioOverview(userId) {
    const balances = await this.getAllBalances(userId);
    
    // Aggregate by currency
    const portfolio = {};
    for (const balance of balances) {
      if (!portfolio[balance.currency]) {
        portfolio[balance.currency] = {
          currency: balance.currency,
          total: '0',
          exchanges: []
        };
      }
      
      portfolio[balance.currency].total = (
        parseFloat(portfolio[balance.currency].total) + 
        parseFloat(balance.total)
      ).toString();
      
      portfolio[balance.currency].exchanges.push({
        exchange: balance.exchangeName,
        amount: balance.total
      });
    }

    return Object.values(portfolio);
  }

  // Test exchange connection
  async testConnection(userId, exchangeKey) {
    try {
      const exchange = this.getUserExchange(userId, exchangeKey);
      
      // Try to fetch balances as a connection test
      await exchange.getBalances();
      return { status: 'success', message: 'Connection successful' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message || 'Connection failed' 
      };
    }
  }
}

module.exports = ExchangeService;