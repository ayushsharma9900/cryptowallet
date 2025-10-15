'use client';

import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Settings, Eye, EyeOff } from 'lucide-react';

interface WalletData {
  _id: string;
  name: string;
  cryptocurrency: string;
  address: string;
  balance: string;
  balanceUSD: number;
  isPrimary: boolean;
}

export default function Dashboard() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    console.log('Initial token check:', token ? 'Token exists' : 'No token found');
    if (token) {
      console.log('Token length:', token.length);
      setIsAuthenticated(true);
      fetchWallets();
      fetchProfile();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setIsAuthenticated(true);
        fetchWallets();
        fetchProfile();
        setShowLogin(false);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setIsAuthenticated(true);
        fetchWallets();
        fetchProfile();
        setShowLogin(false);
        setIsRegistering(false);
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/wallets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallets(data.data.wallets);
        
        // Calculate total balance
        const total = data.data.wallets.reduce((sum: number, wallet: WalletData) => 
          sum + wallet.balanceUSD, 0);
        setTotalBalanceUSD(total);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const createWallet = async (cryptocurrency: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `My ${cryptocurrency} Wallet`,
          cryptocurrency,
          walletType: 'hot'
        })
      });
      
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (response.ok) {
        fetchWallets(); // Refresh wallets
        alert('Wallet created successfully!');
      } else {
        alert(`Failed to create wallet: ${data.message || 'Unknown error'}`);
        // If unauthorized, redirect to login
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
          setUser(null);
          setWallets([]);
        }
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      alert('Failed to create wallet');
    }
  };

  const getCryptoIcon = (crypto: string) => {
    const icons: { [key: string]: string } = {
      BTC: '₿',
      ETH: 'Ξ',
      LTC: 'Ł',
      BCH: '₿',
      ADA: '₳',
      DOT: '●',
      LINK: '🔗',
      XRP: 'XRP',
      BNB: 'BNB',
      USDT: '$',
      USDC: '$'
    };
    return icons[crypto] || crypto;
  };

  const formatBalance = (balance: string, crypto: string) => {
    const decimals = {
      BTC: 8,
      ETH: 18,
      LTC: 8,
      BCH: 8,
      ADA: 6,
      DOT: 10,
      LINK: 18,
      XRP: 6,
      BNB: 18,
      USDT: 6,
      USDC: 6
    } as { [key: string]: number };
    
    const decimal = decimals[crypto] || 18;
    const divisor = Math.pow(10, decimal);
    return (parseFloat(balance) / divisor).toFixed(6);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    setWallets([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CryptoWallet</h1>
            <p className="text-gray-600">Your secure crypto payment platform</p>
          </div>
          
          {!showLogin ? (
            <div className="space-y-4">
              <button 
                onClick={() => { setShowLogin(true); setIsRegistering(false); }}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setShowLogin(true); setIsRegistering(true); }}
                className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Create Account
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <>
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  required
                />
                {isRegistering && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="mb-1">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                      <li>One special character (@$!%*?&)</li>
                    </ul>
                  </div>
                )}
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
              </button>
              <button 
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-gray-600 py-2 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            </form>
            </>
          )}
          
          {!showLogin && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">10+</div>
                  <div className="text-sm text-gray-500">Cryptocurrencies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">Secure</div>
                  <div className="text-sm text-gray-500">2FA Protected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">Fast</div>
                  <div className="text-sm text-gray-500">Instant Transfers</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">CryptoWallet</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user ? (user as any).firstName?.[0] : 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Overview */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Portfolio Value</p>
              <div className="flex items-center">
                {showBalance ? (
                  <h2 className="text-3xl font-bold">${totalBalanceUSD.toLocaleString()}</h2>
                ) : (
                  <h2 className="text-3xl font-bold">••••••</h2>
                )}
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="ml-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-blue-100 text-xs mb-1">24h Change</p>
              <p className="text-green-300 font-semibold">+2.5%</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs mb-1">Total Wallets</p>
              <p className="text-white font-semibold">{wallets.length}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs mb-1">Active Coins</p>
              <p className="text-white font-semibold">{new Set(wallets.map(w => w.cryptocurrency)).size}</p>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {wallets.map((wallet) => (
            <div key={wallet._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg font-bold text-gray-700">
                      {getCryptoIcon(wallet.cryptocurrency)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
                    <p className="text-sm text-gray-500">{wallet.cryptocurrency}</p>
                  </div>
                </div>
                {wallet.isPrimary && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                    Primary
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Balance:</span>
                  {showBalance ? (
                    <span className="font-semibold text-gray-900">
                      {formatBalance(wallet.balance, wallet.cryptocurrency)} {wallet.cryptocurrency}
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-900">••••••</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">USD Value:</span>
                  {showBalance ? (
                    <span className="font-semibold text-gray-900">${wallet.balanceUSD.toLocaleString()}</span>
                  ) : (
                    <span className="font-semibold text-gray-900">••••••</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 truncate">{wallet.address}</p>
              </div>
            </div>
          ))}
          
          {/* Add New Wallet Card */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6">
            <div className="text-center mb-4">
              <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Add New Wallet</p>
              <p className="text-gray-400 text-sm">Create or import a wallet</p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => createWallet('BTC')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ₿ Bitcoin Wallet
              </button>
              <button 
                onClick={() => createWallet('ETH')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Ξ Ethereum Wallet
              </button>
              <button 
                onClick={() => createWallet('USDT')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                $ USDT Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Send
            </button>
            <button className="flex items-center justify-center p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
              <ArrowDownLeft className="w-5 h-5 mr-2" />
              Receive
            </button>
            <button className="flex items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Buy Crypto
            </button>
            <button className="flex items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
