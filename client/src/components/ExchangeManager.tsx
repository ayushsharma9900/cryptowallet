'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, TestTube, Eye, EyeOff } from 'lucide-react';

interface Exchange {
  name: string;
  displayName: string;
  description: string;
  supportedFeatures: string[];
  requiredCredentials: string[];
}

interface ConnectedExchange {
  id: string;
  name: string;
  label: string | null;
  status: 'connected' | 'error';
}

interface ExchangeCredentials {
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  sandbox?: boolean;
}

interface Balance {
  currency: string;
  available: string;
  locked: string;
  total: string;
  exchange: string;
  exchangeName: string;
}

export default function ExchangeManager() {
  const [availableExchanges, setAvailableExchanges] = useState<Exchange[]>([]);
  const [connectedExchanges, setConnectedExchanges] = useState<ConnectedExchange[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [credentials, setCredentials] = useState<ExchangeCredentials>({
    apiKey: '',
    secretKey: '',
    passphrase: '',
    sandbox: false
  });
  const [label, setLabel] = useState('');
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableExchanges();
    fetchConnectedExchanges();
    fetchBalances();
  }, []);

  const fetchAvailableExchanges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/exchanges/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableExchanges(data.data.exchanges);
      }
    } catch (err) {
      console.error('Failed to fetch available exchanges:', err);
    }
  };

  const fetchConnectedExchanges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/exchanges/connected', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectedExchanges(data.data.exchanges);
      }
    } catch (err) {
      console.error('Failed to fetch connected exchanges:', err);
    }
  };

  const fetchBalances = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/exchanges/balances', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalances(data.data.balances);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  const connectExchange = async () => {
    if (!selectedExchange) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/exchanges/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exchangeName: selectedExchange.name,
          credentials,
          label: label || null
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowAddModal(false);
        setCredentials({ apiKey: '', secretKey: '', passphrase: '', sandbox: false });
        setLabel('');
        setSelectedExchange(null);
        fetchConnectedExchanges();
        fetchBalances();
        alert('Exchange connected successfully!');
      } else {
        setError(data.message || 'Failed to connect exchange');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const disconnectExchange = async (exchangeKey: string) => {
    if (!confirm('Are you sure you want to disconnect this exchange?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5001/api/exchanges/disconnect/${exchangeKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchConnectedExchanges();
        fetchBalances();
        alert('Exchange disconnected successfully!');
      }
    } catch (err) {
      console.error('Failed to disconnect exchange:', err);
    }
  };

  const testConnection = async (exchangeKey: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5001/api/exchanges/test/${exchangeKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      alert(data.message);
    } catch {
      alert('Failed to test connection');
    }
  };

  const toggleCredentialVisibility = (field: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num > 0 ? num.toFixed(8) : '0.00000000';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exchange Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connect Exchange
        </button>
      </div>

      {/* Connected Exchanges */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Connected Exchanges</h3>
        {connectedExchanges.length === 0 ? (
          <p className="text-gray-500">No exchanges connected yet. Connect your first exchange to get started.</p>
        ) : (
          <div className="space-y-3">
            {connectedExchanges.map((exchange) => (
              <div key={exchange.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    exchange.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium capitalize">{exchange.name}</p>
                    {exchange.label && (
                      <p className="text-sm text-gray-500">{exchange.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testConnection(exchange.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Test Connection"
                  >
                    <TestTube className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => disconnectExchange(exchange.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Overview */}
      {balances.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-left py-2">Exchange</th>
                  <th className="text-right py-2">Available</th>
                  <th className="text-right py-2">Locked</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{balance.currency}</td>
                    <td className="py-2 text-gray-600 capitalize">{balance.exchangeName}</td>
                    <td className="py-2 text-right">{formatBalance(balance.available)}</td>
                    <td className="py-2 text-right">{formatBalance(balance.locked)}</td>
                    <td className="py-2 text-right font-medium">{formatBalance(balance.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Exchange Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Connect Exchange</h3>
            
            {!selectedExchange ? (
              <div className="space-y-3">
                {availableExchanges.map((exchange) => (
                  <button
                    key={exchange.name}
                    onClick={() => setSelectedExchange(exchange)}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <h4 className="font-medium">{exchange.displayName}</h4>
                    <p className="text-sm text-gray-600 mt-1">{exchange.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exchange.supportedFeatures.map((feature) => (
                        <span key={feature} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{selectedExchange.displayName}</h4>
                  <button
                    onClick={() => setSelectedExchange(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Back
                  </button>
                </div>
                
                {error && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Label (optional)</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Main Account"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">API Key *</label>
                  <div className="relative">
                    <input
                      type={showCredentials.apiKey ? 'text' : 'password'}
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                      className="w-full px-3 py-2 border rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => toggleCredentialVisibility('apiKey')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials.apiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Secret Key *</label>
                  <div className="relative">
                    <input
                      type={showCredentials.secretKey ? 'text' : 'password'}
                      value={credentials.secretKey}
                      onChange={(e) => setCredentials({...credentials, secretKey: e.target.value})}
                      className="w-full px-3 py-2 border rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => toggleCredentialVisibility('secretKey')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials.secretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {selectedExchange.requiredCredentials.includes('passphrase') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Passphrase *</label>
                    <div className="relative">
                      <input
                        type={showCredentials.passphrase ? 'text' : 'password'}
                        value={credentials.passphrase || ''}
                        onChange={(e) => setCredentials({...credentials, passphrase: e.target.value})}
                        className="w-full px-3 py-2 border rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => toggleCredentialVisibility('passphrase')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showCredentials.passphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sandbox"
                    checked={credentials.sandbox}
                    onChange={(e) => setCredentials({...credentials, sandbox: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="sandbox" className="text-sm">Use Sandbox/Testnet</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedExchange(null);
                      setCredentials({ apiKey: '', secretKey: '', passphrase: '', sandbox: false });
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={connectExchange}
                    disabled={loading || !credentials.apiKey || !credentials.secretKey}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}