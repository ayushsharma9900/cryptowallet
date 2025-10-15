const crypto = require('crypto');
const axios = require('axios');

class KrakenExchange {
  constructor() {
    this.name = 'kraken';
    this.baseUrl = 'https://api.kraken.com';
    this.credentials = null;
  }

  setCredentials(credentials) {
    this.credentials = credentials;
  }

  // Generate signature for Kraken API
  generateSignature(path, nonce, postData) {
    const message = path + crypto.createHash('sha256').update(nonce + postData).digest();
    const signature = crypto
      .createHmac('sha512', Buffer.from(this.credentials.secretKey, 'base64'))
      .update(message)
      .digest('base64');
    return signature;
  }

  // Make authenticated request
  async makeRequest(method, endpoint, params = {}, isPrivate = false) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if (isPrivate) {
      const nonce = Date.now() * 1000;
      params.nonce = nonce;
      const postData = new URLSearchParams(params).toString();
      
      headers['API-Key'] = this.credentials.apiKey;
      headers['API-Sign'] = this.generateSignature(endpoint, nonce.toString(), postData);
    }

    try {
      const response = await axios({
        method,
        url,
        headers,
        data: isPrivate ? new URLSearchParams(params).toString() : undefined,
        params: !isPrivate ? params : undefined
      });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(response.data.error.join(', '));
      }

      return response.data.result;
    } catch (error) {
      console.error('Kraken API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get account balances
  async getBalances() {
    const response = await this.makeRequest('POST', '/0/private/Balance', {}, true);
    
    return Object.entries(response).map(([currency, balance]) => ({
      currency: currency.startsWith('X') || currency.startsWith('Z') ? 
        currency.substring(1) : currency,
      available: balance,
      locked: '0',
      total: balance
    }));
  }

  // Get ticker data
  async getTicker(symbol) {
    const response = await this.makeRequest('GET', '/0/public/Ticker', { pair: symbol });
    const data = response[symbol];
    
    return {
      symbol,
      price: data.c[0],
      change24h: ((parseFloat(data.c[0]) - parseFloat(data.o)) / parseFloat(data.o) * 100).toString(),
      volume24h: data.v[1],
      high24h: data.h[1],
      low24h: data.l[1],
      timestamp: Date.now()
    };
  }

  // Get order book
  async getOrderBook(symbol, count = 100) {
    const response = await this.makeRequest('GET', '/0/public/Depth', { 
      pair: symbol, 
      count: Math.min(count, 500)
    });
    const data = response[symbol];
    
    return {
      bids: data.bids,
      asks: data.asks,
      timestamp: Date.now()
    };
  }

  // Create order
  async createOrder(orderData) {
    const params = {
      pair: orderData.symbol,
      type: orderData.side,
      ordertype: orderData.type,
      volume: orderData.amount
    };

    if (orderData.type === 'limit') {
      params.price = orderData.price;
    }

    const response = await this.makeRequest('POST', '/0/private/AddOrder', params, true);
    
    return {
      id: response.txid[0],
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
      await this.makeRequest('POST', '/0/private/CancelOrder', { txid: orderId }, true);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get order details
  async getOrder(orderId) {
    const response = await this.makeRequest('POST', '/0/private/QueryOrders', {
      txid: orderId
    }, true);
    
    const order = response[orderId];
    return this.formatOrder(orderId, order);
  }

  // Get orders
  async getOrders() {
    const response = await this.makeRequest('POST', '/0/private/OpenOrders', {}, true);
    
    return Object.entries(response.open).map(([id, order]) => 
      this.formatOrder(id, order)
    );
  }

  // Format order data
  formatOrder(id, order) {
    const statusMap = {
      'pending': 'open',
      'open': 'open',
      'closed': 'filled',
      'canceled': 'cancelled',
      'expired': 'cancelled'
    };

    return {
      id,
      symbol: order.descr.pair,
      type: order.descr.ordertype,
      side: order.descr.type,
      amount: order.vol,
      price: order.descr.price || order.price,
      status: statusMap[order.status] || 'open',
      timestamp: Math.floor(order.opentm * 1000)
    };
  }

  // Get trade history
  async getTrades(symbol = null) {
    const response = await this.makeRequest('POST', '/0/private/TradesHistory', {}, true);
    
    return Object.entries(response.trades).map(([id, trade]) => ({
      id,
      symbol: trade.pair,
      side: trade.type,
      amount: trade.vol,
      price: trade.price,
      fee: trade.fee,
      timestamp: Math.floor(trade.time * 1000)
    }));
  }
}

module.exports = KrakenExchange;