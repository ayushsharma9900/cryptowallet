export interface ExchangeCredentials {
  apiKey: string;
  secretKey: string;
  passphrase?: string; // For Coinbase Pro
  sandbox?: boolean;
}

export interface Balance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

export interface OrderBook {
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  fee: string;
  timestamp: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: string;
  price?: string;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  timestamp: number;
}

export interface MarketData {
  symbol: string;
  price: string;
  change24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  timestamp: number;
}

export interface ExchangeInterface {
  name: string;
  
  // Authentication
  setCredentials(credentials: ExchangeCredentials): void;
  
  // Account
  getBalances(): Promise<Balance[]>;
  
  // Market Data
  getTicker(symbol: string): Promise<MarketData>;
  getOrderBook(symbol: string): Promise<OrderBook>;
  
  // Trading
  createOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order>;
  cancelOrder(orderId: string): Promise<boolean>;
  getOrder(orderId: string): Promise<Order>;
  getOrders(symbol?: string): Promise<Order[]>;
  
  // Trading History
  getTrades(symbol?: string, limit?: number): Promise<Trade[]>;
}

export type ExchangeName = 'coinbase' | 'binance' | 'kraken' | 'kucoin';

export interface ExchangeConfig {
  name: ExchangeName;
  displayName: string;
  baseUrl: string;
  sandboxUrl?: string;
  rateLimits: {
    requests: number;
    interval: number; // milliseconds
  };
}