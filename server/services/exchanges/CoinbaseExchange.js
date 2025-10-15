const crypto = require('crypto');
const axios = require('axios');

class CoinbaseExchange {
  constructor() {
    this.name = 'coinbase';
    this.baseUrl = 'https://api.coinbase.com/api/v3/brokerage';
    this.sandboxUrl = 'https://api-public.sandbox.exchange.coinbase.com';
    this.credentials = null;
  }

  setCredentials(credentials) {
    this.credentials = credentials;
  }

  // Generate JWT token for Coinbase Advanced Trade API
  generateJWT() {
    if (!this.credentials) {
      throw new Error('Credentials not set for Coinbase');
    }

    const header = {
      alg: 'ES256',
      kid: this.credentials.apiKey,
      nonce: Date.now().toString()
    };

    const payload = {
      sub: this.credentials.apiKey,
      iss: 'coinbase-cloud',
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      aud: ['public_websocket_api']
    };

    // Note: In production, use proper JWT signing with ES256
    // This is a simplified version - you'll need to implement proper JWT signing
    const token = Buffer.from(JSON.stringify(header)).toString('base64') + '.' +
                  Buffer.from(JSON.stringify(payload)).toString('base64') + '.' +
                  'signature'; // Replace with actual ES256 signature
    
    return token;
  }

  // Make authenticated request
  async makeRequest(method, endpoint, data = null) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const requestPath = `/api/v3/brokerage${endpoint}`;
    const body = data ? JSON.stringify(data) : '';
    
    // Create signature for CB-ACCESS-SIGN header
    const message = timestamp + method.toUpperCase() + requestPath + body;
    const signature = crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(message)
      .digest('hex');

    const headers = {
      'CB-ACCESS-KEY': this.credentials.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'Content-Type': 'application/json'
    };

    const url = (this.credentials.sandbox ? this.sandboxUrl : this.baseUrl) + endpoint;
    
    try {
      const response = await axios({
        method,
        url,
        headers,
        data: data ? data : undefined
      });
      return response.data;
    } catch (error) {
      console.error('Coinbase API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get account balances
  async getBalances() {
    const response = await this.makeRequest('GET', '/accounts');
    
    return response.accounts.map(account => ({
      currency: account.currency,
      available: account.available_balance.value,
      locked: account.hold.value,
      total: (parseFloat(account.available_balance.value) + parseFloat(account.hold.value)).toString()
    }));
  }

  // Get ticker data
  async getTicker(symbol) {
    const response = await this.makeRequest('GET', `/products/${symbol}/ticker`);
    
    return {
      symbol,
      price: response.price,
      change24h: response.change,
      volume24h: response.volume,
      high24h: response.high,
      low24h: response.low,
      timestamp: Date.now()
    };
  }

  // Get order book
  async getOrderBook(symbol) {
    const response = await this.makeRequest('GET', `/products/${symbol}/book`);
    
    return {
      bids: response.bids.map(bid => [bid.price, bid.size]),
      asks: response.asks.map(ask => [ask.price, ask.size]),
      timestamp: Date.now()
    };
  }

  // Create order
  async createOrder(orderData) {
    const payload = {
      product_id: orderData.symbol,
      side: orderData.side,
      order_configuration: {
        [orderData.type === 'market' ? 'market_market_ioc' : 'limit_limit_gtc']: {
          ...(orderData.type === 'market' ? 
            { [orderData.side === 'buy' ? 'quote_size' : 'base_size']: orderData.amount } :
            { base_size: orderData.amount, limit_price: orderData.price }
          )
        }
      }
    };

    const response = await this.makeRequest('POST', '/orders', payload);
    
    return {
      id: response.order_id,
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
      await this.makeRequest('DELETE', `/orders/${orderId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get order details
  async getOrder(orderId) {
    const response = await this.makeRequest('GET', `/orders/historical/${orderId}`);
    const order = response.order;
    
    return {
      id: order.order_id,
      symbol: order.product_id,
      type: order.order_type,
      side: order.side,
      amount: order.order_configuration.limit_limit_gtc?.base_size || order.size,
      price: order.order_configuration.limit_limit_gtc?.limit_price || order.price,
      status: order.status,
      timestamp: new Date(order.created_time).getTime()
    };
  }

  // Get orders
  async getOrders(symbol = null) {
    const endpoint = symbol ? `/orders/historical?product_id=${symbol}` : '/orders/historical';
    const response = await this.makeRequest('GET', endpoint);
    
    return response.orders.map(order => ({
      id: order.order_id,
      symbol: order.product_id,
      type: order.order_type,
      side: order.side,
      amount: order.order_configuration.limit_limit_gtc?.base_size || order.size,
      price: order.order_configuration.limit_limit_gtc?.limit_price || order.price,
      status: order.status,
      timestamp: new Date(order.created_time).getTime()
    }));
  }

  // Get trade history
  async getTrades(symbol = null, limit = 100) {
    const endpoint = symbol ? `/orders/historical/fills?product_id=${symbol}` : '/orders/historical/fills';
    const response = await this.makeRequest('GET', endpoint);
    
    return response.fills.slice(0, limit).map(fill => ({
      id: fill.trade_id,
      symbol: fill.product_id,
      side: fill.side,
      amount: fill.size,
      price: fill.price,
      fee: fill.commission,
      timestamp: new Date(fill.trade_time).getTime()
    }));
  }
}

module.exports = CoinbaseExchange;