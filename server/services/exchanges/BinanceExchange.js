const crypto = require('crypto');
const axios = require('axios');

class BinanceExchange {
  constructor() {
    this.name = 'binance';
    this.baseUrl = 'https://api.binance.com';
    this.testnetUrl = 'https://testnet.binance.vision';
    this.credentials = null;
  }

  setCredentials(credentials) {
    this.credentials = credentials;
  }

  // Generate signature for authenticated requests
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // Make authenticated request
  async makeRequest(method, endpoint, params = {}, signed = false) {
    const baseUrl = this.credentials?.sandbox ? this.testnetUrl : this.baseUrl;
    let url = `${baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'X-MBX-APIKEY': this.credentials?.apiKey
    };

    if (signed) {
      params.timestamp = Date.now();
      const queryString = new URLSearchParams(params).toString();
      params.signature = this.generateSignature(queryString);
    }

    if (Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString();
    }

    try {
      const response = await axios({
        method,
        url,
        headers: signed ? headers : { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Binance API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get account balances
  async getBalances() {
    const response = await this.makeRequest('GET', '/api/v3/account', {}, true);
    
    return response.balances
      .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
      .map(balance => ({
        currency: balance.asset,
        available: balance.free,
        locked: balance.locked,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString()
      }));
  }

  // Get ticker data
  async getTicker(symbol) {
    const response = await this.makeRequest('GET', '/api/v3/ticker/24hr', { symbol });
    
    return {
      symbol,
      price: response.lastPrice,
      change24h: response.priceChangePercent,
      volume24h: response.volume,
      high24h: response.highPrice,
      low24h: response.lowPrice,
      timestamp: response.closeTime
    };
  }

  // Get order book
  async getOrderBook(symbol, limit = 100) {
    const response = await this.makeRequest('GET', '/api/v3/depth', { symbol, limit });
    
    return {
      bids: response.bids,
      asks: response.asks,
      timestamp: Date.now()
    };
  }

  // Create order
  async createOrder(orderData) {
    const params = {
      symbol: orderData.symbol,
      side: orderData.side.toUpperCase(),
      type: orderData.type.toUpperCase(),
      quantity: orderData.amount,
      timeInForce: 'GTC'
    };

    if (orderData.type === 'limit') {
      params.price = orderData.price;
    }

    const response = await this.makeRequest('POST', '/api/v3/order', params, true);
    
    return {
      id: response.orderId.toString(),
      symbol: response.symbol,
      type: orderData.type,
      side: orderData.side,
      amount: response.origQty,
      price: response.price || orderData.price,
      status: this.mapOrderStatus(response.status),
      timestamp: response.transactTime
    };
  }

  // Map Binance order status to our standard format
  mapOrderStatus(binanceStatus) {
    const statusMap = {
      'NEW': 'open',
      'PARTIALLY_FILLED': 'partial',
      'FILLED': 'filled',
      'CANCELED': 'cancelled',
      'REJECTED': 'cancelled',
      'EXPIRED': 'cancelled'
    };
    return statusMap[binanceStatus] || 'open';
  }

  // Cancel order
  async cancelOrder(orderId, symbol) {
    try {
      await this.makeRequest('DELETE', '/api/v3/order', {
        symbol,
        orderId: parseInt(orderId)
      }, true);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get order details
  async getOrder(orderId, symbol) {
    const response = await this.makeRequest('GET', '/api/v3/order', {
      symbol,
      orderId: parseInt(orderId)
    }, true);
    
    return {
      id: response.orderId.toString(),
      symbol: response.symbol,
      type: response.type.toLowerCase(),
      side: response.side.toLowerCase(),
      amount: response.origQty,
      price: response.price,
      status: this.mapOrderStatus(response.status),
      timestamp: response.time
    };
  }

  // Get orders
  async getOrders(symbol = null) {
    if (!symbol) {
      // Get all open orders
      const response = await this.makeRequest('GET', '/api/v3/openOrders', {}, true);
      return response.map(order => ({
        id: order.orderId.toString(),
        symbol: order.symbol,
        type: order.type.toLowerCase(),
        side: order.side.toLowerCase(),
        amount: order.origQty,
        price: order.price,
        status: this.mapOrderStatus(order.status),
        timestamp: order.time
      }));
    }

    const response = await this.makeRequest('GET', '/api/v3/allOrders', { symbol }, true);
    
    return response.map(order => ({
      id: order.orderId.toString(),
      symbol: order.symbol,
      type: order.type.toLowerCase(),
      side: order.side.toLowerCase(),
      amount: order.origQty,
      price: order.price,
      status: this.mapOrderStatus(order.status),
      timestamp: order.time
    }));
  }

  // Get trade history
  async getTrades(symbol = null, limit = 500) {
    if (!symbol) {
      throw new Error('Symbol is required for Binance trade history');
    }

    const response = await this.makeRequest('GET', '/api/v3/myTrades', {
      symbol,
      limit: Math.min(limit, 1000)
    }, true);
    
    return response.map(trade => ({
      id: trade.id.toString(),
      symbol: trade.symbol,
      side: trade.isBuyer ? 'buy' : 'sell',
      amount: trade.qty,
      price: trade.price,
      fee: trade.commission,
      timestamp: trade.time
    }));
  }

  // Get all trading pairs
  async getTradingPairs() {
    const response = await this.makeRequest('GET', '/api/v3/exchangeInfo');
    
    return response.symbols
      .filter(symbol => symbol.status === 'TRADING')
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        status: symbol.status,
        minQty: symbol.filters.find(f => f.filterType === 'LOT_SIZE')?.minQty,
        maxQty: symbol.filters.find(f => f.filterType === 'LOT_SIZE')?.maxQty,
        stepSize: symbol.filters.find(f => f.filterType === 'LOT_SIZE')?.stepSize
      }));
  }

  // Get server time (useful for synchronization)
  async getServerTime() {
    const response = await this.makeRequest('GET', '/api/v3/time');
    return response.serverTime;
  }

  // Test connectivity
  async testConnectivity() {
    try {
      await this.makeRequest('GET', '/api/v3/ping');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = BinanceExchange;