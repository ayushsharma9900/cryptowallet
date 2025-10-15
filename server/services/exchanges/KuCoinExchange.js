const crypto = require('crypto');
const axios = require('axios');

class KuCoinExchange {
  constructor() {
    this.name = 'kucoin';
    this.baseUrl = 'https://api.kucoin.com';
    this.sandboxUrl = 'https://openapi-sandbox.kucoin.com';
    this.credentials = null;
  }

  setCredentials(credentials) {
    this.credentials = credentials;
  }

  // Generate signature for KuCoin API
  generateSignature(timestamp, method, requestPath, body = '') {
    const strForSign = timestamp + method + requestPath + body;
    return crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(strForSign)
      .digest('base64');
  }

  // Make authenticated request
  async makeRequest(method, endpoint, params = {}, body = null, isPrivate = false) {
    const baseUrl = this.credentials?.sandbox ? this.sandboxUrl : this.baseUrl;
    let url = `${baseUrl}${endpoint}`;

    if (method === 'GET' && Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString();
    }

    const headers = { 'Content-Type': 'application/json' };

    if (isPrivate) {
      const timestamp = Date.now();
      const requestPath = endpoint + (method === 'GET' && Object.keys(params).length > 0 
        ? '?' + new URLSearchParams(params).toString() : '');
      const bodyStr = body ? JSON.stringify(body) : '';

      headers['KC-API-KEY'] = this.credentials.apiKey;
      headers['KC-API-SIGN'] = this.generateSignature(timestamp, method, requestPath, bodyStr);
      headers['KC-API-TIMESTAMP'] = timestamp;
      headers['KC-API-PASSPHRASE'] = crypto
        .createHmac('sha256', this.credentials.secretKey)
        .update(this.credentials.passphrase)
        .digest('base64');
      headers['KC-API-KEY-VERSION'] = '2';
    }

    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body
      });

      if (response.data.code !== '200000') {
        throw new Error(response.data.msg || 'KuCoin API error');
      }

      return response.data.data;
    } catch (error) {
      console.error('KuCoin API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get account balances
  async getBalances() {
    const response = await this.makeRequest('GET', '/api/v1/accounts', {}, null, true);
    
    const balanceMap = new Map();
    response.forEach(account => {
      const currency = account.currency;
      if (!balanceMap.has(currency)) {
        balanceMap.set(currency, {
          currency,
          available: '0',
          locked: '0',
          total: '0'
        });
      }
      
      const balance = balanceMap.get(currency);
      if (account.type === 'trade') {
        balance.available = (parseFloat(balance.available) + parseFloat(account.available)).toString();
        balance.locked = (parseFloat(balance.locked) + parseFloat(account.holds)).toString();
      }
    });

    return Array.from(balanceMap.values()).map(balance => ({
      ...balance,
      total: (parseFloat(balance.available) + parseFloat(balance.locked)).toString()
    }));
  }

  // Get ticker data
  async getTicker(symbol) {
    const response = await this.makeRequest('GET', '/api/v1/market/orderbook/level1', { symbol });
    
    // Get 24hr stats
    const stats = await this.makeRequest('GET', '/api/v1/market/stats', { symbol });
    
    return {
      symbol,
      price: response.price,
      change24h: stats.changeRate,
      volume24h: stats.vol,
      high24h: stats.high,
      low24h: stats.low,
      timestamp: response.time
    };
  }

  // Get order book
  async getOrderBook(symbol) {
    const response = await this.makeRequest('GET', '/api/v1/market/orderbook/level2_100', { symbol });
    
    return {
      bids: response.bids,
      asks: response.asks,
      timestamp: response.time
    };
  }

  // Create order
  async createOrder(orderData) {
    const body = {
      clientOid: crypto.randomUUID(),
      side: orderData.side,
      symbol: orderData.symbol,
      type: orderData.type,
      size: orderData.amount
    };

    if (orderData.type === 'limit') {
      body.price = orderData.price;
    }

    const response = await this.makeRequest('POST', '/api/v1/orders', {}, body, true);
    
    return {
      id: response.orderId,
      symbol: orderData.symbol,
      type: orderData.type,
      side: orderData.side,
      amount: orderData.amount,
      price: orderData.price,
      status: 'open',
      timestamp: Date.now()
    };
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      await this.makeRequest('DELETE', `/api/v1/orders/${orderId}`, {}, null, true);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get order details
  async getOrder(orderId) {
    const response = await this.makeRequest('GET', `/api/v1/orders/${orderId}`, {}, null, true);
    
    return this.formatOrder(response);
  }

  // Get orders
  async getOrders(symbol = null, status = 'active') {
    const params = { status };
    if (symbol) params.symbol = symbol;
    
    const response = await this.makeRequest('GET', '/api/v1/orders', params, null, true);
    
    return response.items.map(order => this.formatOrder(order));
  }

  // Format order data
  formatOrder(order) {
    const statusMap = {
      'active': 'open',
      'done': 'filled',
      'cancel': 'cancelled'
    };

    return {
      id: order.id,
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      amount: order.size,
      price: order.price,
      status: statusMap[order.isActive ? 'active' : order.cancelExist ? 'cancel' : 'done'] || 'open',
      timestamp: order.createdAt
    };
  }

  // Get trade history
  async getTrades(symbol = null, limit = 50) {
    const params = { pageSize: Math.min(limit, 500) };
    if (symbol) params.symbol = symbol;
    
    const response = await this.makeRequest('GET', '/api/v1/fills', params, null, true);
    
    return response.items.map(fill => ({
      id: fill.tradeId,
      symbol: fill.symbol,
      side: fill.side,
      amount: fill.size,
      price: fill.price,
      fee: fill.fee,
      timestamp: fill.createdAt
    }));
  }

  // Get trading pairs
  async getTradingPairs() {
    const response = await this.makeRequest('GET', '/api/v1/symbols');
    
    return response
      .filter(symbol => symbol.enableTrading)
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseCurrency,
        quoteAsset: symbol.quoteCurrency,
        status: symbol.enableTrading ? 'TRADING' : 'INACTIVE',
        minQty: symbol.baseMinSize,
        maxQty: symbol.baseMaxSize,
        stepSize: symbol.baseIncrement
      }));
  }
}

module.exports = KuCoinExchange;