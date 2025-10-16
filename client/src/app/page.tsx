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

interface ValidationError {
  msg: string;
  param: string;
  location: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Exchange {
  name: string;
  displayName: string;
  description: string;
  supportedFeatures: string[];
  requiredCredentials: string[];
}

export default function Dashboard() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickAction, setShowQuickAction] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState({
    fromWallet: '',
    recipientAddress: '',
    amount: '',
    note: ''
  });
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [buyForm, setBuyForm] = useState({
    cryptocurrency: '',
    amount: '',
    paymentMethod: ''
  });
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [exchanges, setExchanges] = useState([]);
  const [showExchangeManager, setShowExchangeManager] = useState(false);
  const [availableExchanges, setAvailableExchanges] = useState([]);
  const [selectedExchangeForConnection, setSelectedExchangeForConnection] = useState(null);
  const [connectionCredentials, setConnectionCredentials] = useState({
    apiKey: '',
    secretKey: '',
    passphrase: '',
    sandbox: false,
    label: ''
  });
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showCredentialFields, setShowCredentialFields] = useState({});
  const [userSettings, setUserSettings] = useState({
    showBalances: true,
    defaultCurrency: 'USD',
    notifications: {
      email: true,
      push: true,
      sms: false,
      trading: true,
      security: true
    },
    privacy: {
      showPortfolio: true,
      showActivity: true,
      dataSharing: false
    },
    trading: {
      confirmations: true,
      autoSlippage: false,
      maxSlippage: 1.0
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    timezone: 'UTC'
  });
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Available cryptocurrencies for wallet creation
  const availableCryptos = [
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', icon: '$' },
    { symbol: 'LTC', name: 'Litecoin', icon: 'Ł' },
    { symbol: 'BCH', name: 'Bitcoin Cash', icon: '₿' },
    { symbol: 'ADA', name: 'Cardano', icon: '₳' },
    { symbol: 'DOT', name: 'Polkadot', icon: '●' },
    { symbol: 'LINK', name: 'Chainlink', icon: '🔗' },
    { symbol: 'XRP', name: 'Ripple', icon: 'XRP' },
    { symbol: 'BNB', name: 'Binance Coin', icon: 'BNB' },
    { symbol: 'USDC', name: 'USD Coin', icon: '$' }
  ];

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    console.log('Initial token check:', token ? 'Token exists' : 'No token found');
    if (token) {
      console.log('Token length:', token.length);
      setIsAuthenticated(true);
      fetchWallets();
      fetchProfile();
      fetchExchanges();
      fetchAvailableExchanges();
      loadUserSettings();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
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
    } catch {
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
      const response = await fetch('http://localhost:5001/api/auth/register', {
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
          const errorMessages = data.errors.map((err: ValidationError) => err.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/wallets', {
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
    } catch {
      console.error('Failed to fetch wallets');
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      }
    } catch {
      console.error('Failed to fetch profile');
    }
  };

  const fetchExchanges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/exchanges/connected', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExchanges(data.data.exchanges);
      }
    } catch {
      console.error('Failed to fetch exchanges');
    }
  };

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
    } catch {
      console.error('Failed to fetch available exchanges');
    }
  };

  const createWallet = async (cryptocurrency: string) => {
    try {
      // Show loading state
      const buttons = document.querySelectorAll(`[data-crypto="${cryptocurrency}"]`) as NodeListOf<HTMLButtonElement>;
      buttons.forEach(btn => {
        btn.innerHTML = '⏳ Creating...';
        btn.disabled = true;
      });

      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Please login first');
        setIsAuthenticated(false);
        return;
      }
      
      console.log('Creating wallet for:', cryptocurrency);
      
      const response = await fetch('http://localhost:5001/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `My ${cryptocurrency} Wallet`,
          cryptocurrency,
          walletType: 'hot',
          network: 'mainnet'
        })
      });
      
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (response.ok) {
        console.log('✅ Wallet created successfully:', data.data.wallet.address);
        alert(`🎉 ${cryptocurrency} Wallet Created Successfully!\nAddress: ${data.data.wallet.address}`);
        fetchWallets(); // Refresh wallets
      } else {
        console.error('❌ Wallet creation failed:', data);
        
        if (response.status === 401) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
          setUser(null);
          setWallets([]);
        } else if (response.status === 400 && data.errors) {
          const errorMsg = data.errors.map((err: ValidationError) => err.msg).join(', ');
          alert(`Validation Error: ${errorMsg}`);
        } else {
          alert(`Failed to create ${cryptocurrency} wallet: ${data.message || 'Unknown error'}`);
        }
      }
    } catch {
      alert(`Network error: Could not connect to server. Please check if the server is running.`);
    } finally {
      // Reset button states
      const buttons = document.querySelectorAll(`[data-crypto="${cryptocurrency}"]`) as NodeListOf<HTMLButtonElement>;
      buttons.forEach(btn => {
        const icons: { [key: string]: string } = { BTC: '₿', ETH: 'Ξ', USDT: '$' };
        btn.innerHTML = `${icons[cryptocurrency] || cryptocurrency} ${cryptocurrency} Wallet`;
        btn.disabled = false;
      });
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

  const handleQuickAction = (action: string) => {
    setShowQuickAction(action);
    setActiveModal(action);
    
    // Reset quick action animation after a short delay
    setTimeout(() => setShowQuickAction(null), 500);
  };

  const closeModal = () => {
    const currentModal = activeModal;
    setActiveModal(null);
    
    if (currentModal === 'send') {
      resetSendForm();
    }
    if (currentModal === 'buy') {
      resetBuyForm();
    }
  };
  
  const resetBuyForm = () => {
    setBuyForm({
      cryptocurrency: '',
      amount: '',
      paymentMethod: ''
    });
    setBuyError('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Address copied to clipboard!');
    }
  };

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setSendError('');
    
    try {
      // Validate form
      if (!sendForm.fromWallet || !sendForm.recipientAddress || !sendForm.amount) {
        setSendError('Please fill in all required fields');
        return;
      }
      
      if (parseFloat(sendForm.amount) <= 0) {
        setSendError('Amount must be greater than 0');
        return;
      }
      
      // Find the selected wallet
      const selectedWallet = wallets.find(w => w._id === sendForm.fromWallet);
      if (!selectedWallet) {
        setSendError('Selected wallet not found');
        return;
      }
      
      // Check if user has sufficient balance
      const currentBalance = parseFloat(formatBalance(selectedWallet.balance, selectedWallet.cryptocurrency));
      if (parseFloat(sendForm.amount) > currentBalance) {
        setSendError(`Insufficient balance. Available: ${currentBalance} ${selectedWallet.cryptocurrency}`);
        return;
      }
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSendError('Please login first');
        setIsAuthenticated(false);
        return;
      }
      
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay to simulate processing
      
      // Generate mock transaction hash
      const generateTxHash = () => '0x' + Math.random().toString(16).substr(2, 64);
      const txHash = generateTxHash();
      
      // Calculate network fees
      const networkFees = {
        BTC: '0.0001',
        ETH: '0.002',
        LTC: '0.001',
        BCH: '0.0001',
        ADA: '0.17',
        DOT: '0.1',
        LINK: '0.002',
        XRP: '0.00001',
        BNB: '0.001',
        USDT: '1',
        USDC: '1'
      } as { [key: string]: string };
      
      const networkFee = networkFees[selectedWallet.cryptocurrency] || '0.001';
      
      // Show success message with transaction details
      alert(`🎉 Transaction Sent Successfully!\n\n🏷️ Transaction ID: ${txHash}\n💰 Amount: ${sendForm.amount} ${selectedWallet.cryptocurrency}\n📫 To: ${sendForm.recipientAddress.substring(0, 10)}...${sendForm.recipientAddress.substring(sendForm.recipientAddress.length - 8)}\n💸 Network Fee: ${networkFee} ${selectedWallet.cryptocurrency}\n✅ Status: Confirmed\n\n📈 Estimated confirmation time: 10-15 minutes\n🔗 View on blockchain explorer`);
      
      // Reset form
      setSendForm({
        fromWallet: '',
        recipientAddress: '',
        amount: '',
        note: ''
      });
      
      // Refresh wallets to update balances (this would normally update from backend)
      fetchWallets();
      
      // Close modal
      closeModal();
    } catch {
      setSendError('Network error. Please check your connection and try again.');
    } finally {
      setSendLoading(false);
    }
  };

  const resetSendForm = () => {
    setSendForm({
      fromWallet: '',
      recipientAddress: '',
      amount: '',
      note: ''
    });
    setSendError('');
  };

  const handleBuyUsingExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exchanges.length === 0) {
      setBuyError('Please connect to an exchange first to buy cryptocurrency.');
      return;
    }

    setBuyLoading(true);
    setBuyError('');

    try {
      // For demo purposes, simulate a buy order
      const selectedExchange = exchanges[0]; // Use first connected exchange
      
      // Calculate estimated crypto amount (mock exchange rate)
      const mockPrices = {
        'BTC': 43000,
        'ETH': 2600,
        'USDT': 1,
        'BNB': 300,
        'ADA': 0.5,
        'DOT': 7,
        'LINK': 15,
        'LTC': 70,
        'BCH': 250,
        'XRP': 0.6,
        'USDC': 1
      };
      
      const price = mockPrices[buyForm.cryptocurrency] || 1;
      const cryptoAmount = (parseFloat(buyForm.amount) / price).toFixed(8);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`🎉 Buy Order Placed Successfully!\n\n💰 Amount: ${cryptoAmount} ${buyForm.cryptocurrency}\n💵 Cost: $${buyForm.amount} USD\n🏦 Exchange: ${selectedExchange.name}\n💳 Payment: ${buyForm.paymentMethod}\n\n⏳ Your order is being processed and will appear in your wallet shortly.`);
      
      // Reset form
      setBuyForm({
        cryptocurrency: '',
        amount: '',
        paymentMethod: ''
      });
      
      // Refresh wallets
      fetchWallets();
      closeModal();
    } catch {
      setBuyError('Failed to place buy order. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  const openExchangeConnection = () => {
    setShowExchangeManager(true);
  };

  const closeExchangeManager = () => {
    setShowExchangeManager(false);
    setSelectedExchangeForConnection(null);
    resetConnectionForm();
    // Refresh exchanges after potential connection
    fetchExchanges();
  };

  const resetConnectionForm = () => {
    setConnectionCredentials({
      apiKey: '',
      secretKey: '',
      passphrase: '',
      sandbox: false,
      label: ''
    });
    setConnectionError('');
    setShowCredentialFields({});
  };

  const handleExchangeConnection = (exchange: Exchange) => {
    setSelectedExchangeForConnection(exchange);
    resetConnectionForm();
  };

  const connectToExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionLoading(true);
    setConnectionError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/exchanges/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exchangeName: selectedExchangeForConnection.name,
          credentials: {
            apiKey: connectionCredentials.apiKey,
            secretKey: connectionCredentials.secretKey,
            ...(connectionCredentials.passphrase && { passphrase: connectionCredentials.passphrase }),
            sandbox: connectionCredentials.sandbox
          },
          label: connectionCredentials.label || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${selectedExchangeForConnection.displayName} Connected Successfully!\n\nYou can now:\n• Buy crypto directly\n• View real-time balances\n• Execute trades\n\nConnection will appear in your exchange list.`);
        setSelectedExchangeForConnection(null);
        resetConnectionForm();
        fetchExchanges(); // Refresh connected exchanges
      } else {
        setConnectionError(data.message || 'Failed to connect exchange');
      }
    } catch {
      setConnectionError('Network error. Please check your connection.');
    } finally {
      setConnectionLoading(false);
    }
  };

  const toggleCredentialVisibility = (field: string) => {
    setShowCredentialFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateUserSetting = (path: string, value: boolean | string | number) => {
    setUserSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Update showBalance state for immediate UI update
      if (path === 'showBalances') {
        setShowBalance(value);
      }
      
      // Save settings to localStorage (in production, would save to backend)
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  const loadUserSettings = () => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure all required nested objects exist
        const completeSettings = {
          showBalances: parsedSettings.showBalances ?? true,
          defaultCurrency: parsedSettings.defaultCurrency ?? 'USD',
          notifications: {
            email: true,
            push: true,
            sms: false,
            trading: true,
            security: true,
            ...parsedSettings.notifications
          },
          privacy: {
            showPortfolio: true,
            showActivity: true,
            dataSharing: false,
            ...parsedSettings.privacy
          },
          trading: {
            confirmations: true,
            autoSlippage: false,
            maxSlippage: 1.0,
            ...parsedSettings.trading
          },
          security: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
            loginNotifications: true,
            ...parsedSettings.security
          }
        };
        setUserSettings(completeSettings);
        setShowBalance(completeSettings.showBalances);
      }
    } catch {
      console.error('Failed to load user settings');
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, would make API call to backend
      // const token = localStorage.getItem('accessToken');
      // const response = await fetch('http://localhost:5001/api/auth/settings', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(userSettings)
      // });
      
      alert('✅ Settings saved successfully!');
    } catch {
      setSettingsError('Failed to save settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings = {
        showBalances: true,
        defaultCurrency: 'USD',
        notifications: {
          email: true,
          push: true,
          sms: false,
          trading: true,
          security: true
        },
        privacy: {
          showPortfolio: true,
          showActivity: true,
          dataSharing: false
        },
        trading: {
          confirmations: true,
          autoSlippage: false,
          maxSlippage: 1.0
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true
        }
      };
      
      setUserSettings(defaultSettings);
      setShowBalance(true);
      localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      alert('Settings reset to default values.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    
    try {
      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (passwordForm.newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long');
        return;
      }
      
      // Password strength validation
      const hasUpper = /[A-Z]/.test(passwordForm.newPassword);
      const hasLower = /[a-z]/.test(passwordForm.newPassword);
      const hasNumber = /\d/.test(passwordForm.newPassword);
      const hasSpecial = /[@$!%*?&]/.test(passwordForm.newPassword);
      
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        setPasswordError('Password must contain uppercase, lowercase, number, and special character');
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, would make actual API call
      // const token = localStorage.getItem('accessToken');
      // const response = await fetch('http://localhost:5001/api/auth/change-password', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     currentPassword: passwordForm.currentPassword,
      //     newPassword: passwordForm.newPassword
      //   })
      // });
      
      alert('🔒 Password Changed Successfully!\n\nYour password has been updated. For security reasons, you will need to login again on other devices.');
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
      
    } catch {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handle2FASetup = () => {
    setShow2FASetup(true);
  };

  const complete2FASetup = async () => {
    try {
      // Simulate 2FA setup process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('🔐 Two-Factor Authentication Enabled!\n\nYour account is now protected with 2FA:\n\n✅ Google Authenticator configured\n✅ Backup codes generated\n✅ SMS fallback enabled\n\nSave your backup codes in a secure location.');
      
      setShow2FASetup(false);
      
      // Update user settings to reflect 2FA status
      updateUserSetting('security.twoFactorEnabled', true);
      
    } catch {
      alert('Failed to setup 2FA. Please try again.');
    }
  };

  const openProfileEdit = () => {
    // Pre-populate form with current user data
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      timezone: 'UTC'
    });
    setShowProfileEdit(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email)) {
        setProfileError('Please enter a valid email address');
        return;
      }
      
      // Validate required fields
      if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
        setProfileError('First name and last name are required');
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, would make actual API call
      // const token = localStorage.getItem('accessToken');
      // const response = await fetch('http://localhost:5001/api/auth/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     firstName: profileForm.firstName,
      //     lastName: profileForm.lastName,
      //     email: profileForm.email,
      //     phone: profileForm.phone,
      //     timezone: profileForm.timezone
      //   })
      // });
      
      // Update local user state
      setUser(prev => ({
        ...prev,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email
      }));
      
      alert('👤 Profile Updated Successfully!\n\nYour profile information has been updated.');
      
      setShowProfileEdit(false);
      
    } catch {
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
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
                  {user?.firstName?.[0] || 'U'}
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableCryptos
                .filter(crypto => !wallets.some(wallet => wallet.cryptocurrency === crypto.symbol))
                .map(crypto => (
                  <button 
                    key={crypto.symbol}
                    onClick={() => createWallet(crypto.symbol)}
                    data-crypto={crypto.symbol}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center">
                      <span className="text-base mr-2">{crypto.icon}</span>
                      <span className="font-medium">{crypto.name}</span>
                      <span className="ml-auto text-xs text-gray-500">{crypto.symbol}</span>
                    </span>
                  </button>
                ))}
              {availableCryptos.filter(crypto => !wallets.some(wallet => wallet.cryptocurrency === crypto.symbol)).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <p>All supported wallets created!</p>
                  <p className="text-xs mt-1">You have wallets for all available cryptocurrencies.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => handleQuickAction('send')}
              className={`flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ${
                showQuickAction === 'send' ? 'scale-95' : ''
              }`}
            >
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Send
            </button>
            <button 
              onClick={() => handleQuickAction('receive')}
              className={`flex items-center justify-center p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors ${
                showQuickAction === 'receive' ? 'scale-95' : ''
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 mr-2" />
              Receive
            </button>
            <button 
              onClick={() => handleQuickAction('buy')}
              className={`flex items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors ${
                showQuickAction === 'buy' ? 'scale-95' : ''
              }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Buy Crypto
            </button>
            <button 
              onClick={() => handleQuickAction('settings')}
              className={`flex items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors ${
                showQuickAction === 'settings' ? 'scale-95' : ''
              }`}
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-2xl w-full max-h-[80vh] overflow-y-auto ${
            activeModal === 'settings' ? 'max-w-2xl' : 'max-w-md'
          }`}>
            {/* Send Modal */}
            {activeModal === 'send' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-3">
                      <ArrowUpRight className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Send Crypto</h2>
                      <p className="text-sm text-gray-500">Transfer crypto to another wallet</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-6 h-6 transform rotate-45" />
                  </button>
                </div>
                
                {wallets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">No wallets found</p>
                    <button 
                      onClick={closeModal}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first wallet
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendTransaction} className="space-y-4">
                    {sendError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{sendError}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Wallet</label>
                      <select 
                        value={sendForm.fromWallet}
                        onChange={(e) => setSendForm({...sendForm, fromWallet: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Choose wallet to send from...</option>
                        {wallets.map(wallet => (
                          <option key={wallet._id} value={wallet._id}>
                            {getCryptoIcon(wallet.cryptocurrency)} {wallet.cryptocurrency} - {formatBalance(wallet.balance, wallet.cryptocurrency)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
                      <input 
                        type="text" 
                        value={sendForm.recipientAddress}
                        onChange={(e) => setSendForm({...sendForm, recipientAddress: e.target.value})}
                        placeholder="Enter recipient&apos;s wallet address"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={sendForm.amount}
                          onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                          placeholder="0.00"
                          step="any"
                          min="0"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {sendForm.fromWallet && (
                          <div className="mt-1 text-xs text-gray-500">
                            Available: {formatBalance(
                              wallets.find(w => w._id === sendForm.fromWallet)?.balance || '0',
                              wallets.find(w => w._id === sendForm.fromWallet)?.cryptocurrency || ''
                            )} {wallets.find(w => w._id === sendForm.fromWallet)?.cryptocurrency}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                      <input 
                        type="text" 
                        value={sendForm.note}
                        onChange={(e) => setSendForm({...sendForm, note: e.target.value})}
                        placeholder="Add a note for this transaction"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex space-x-3">
                        <button 
                          type="button"
                          onClick={closeModal}
                          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={sendLoading}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendLoading ? 'Sending...' : 'Send Transaction'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Receive Modal */}
            {activeModal === 'receive' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-3">
                      <ArrowDownLeft className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Receive Crypto</h2>
                      <p className="text-sm text-gray-500">Your wallet addresses</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-6 h-6 transform rotate-45" />
                  </button>
                </div>
                
                {wallets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">No wallets found</p>
                    <button 
                      onClick={closeModal}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first wallet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallets.map(wallet => (
                      <div key={wallet._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-lg mr-3">{getCryptoIcon(wallet.cryptocurrency)}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{wallet.cryptocurrency}</p>
                              <p className="text-sm text-gray-500">{wallet.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-gray-700 truncate mr-2">{wallet.address}</span>
                            <button 
                              onClick={() => copyToClipboard(wallet.address)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Buy Crypto Modal */}
            {activeModal === 'buy' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-full mr-3">
                      <Plus className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Buy Crypto</h2>
                      <p className="text-sm text-gray-500">Purchase cryptocurrency</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-6 h-6 transform rotate-45" />
                  </button>
                </div>
                
                {exchanges.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to Exchange</h3>
                    <p className="text-gray-600 mb-4">To buy cryptocurrency, you need to connect to a supported exchange first.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-blue-800 text-sm font-medium">✨ Supported Exchanges</p>
                      <p className="text-blue-700 text-xs mt-1">Coinbase, Binance, Kraken, KuCoin</p>
                    </div>
                    <button 
                      onClick={openExchangeConnection}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Connect Exchange
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBuyUsingExchange} className="space-y-4">
                    {buyError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{buyError}</p>
                      </div>
                    )}
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-green-800 text-sm font-medium">🔗 Connected to {exchanges.length} exchange(s)</p>
                      <p className="text-green-700 text-xs mt-1">Using {exchanges[0]?.name} for purchases</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Cryptocurrency</label>
                      <select 
                        value={buyForm.cryptocurrency}
                        onChange={(e) => setBuyForm({...buyForm, cryptocurrency: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">Choose cryptocurrency to buy...</option>
                        {availableCryptos.map(crypto => (
                          <option key={crypto.symbol} value={crypto.symbol}>
                            {crypto.icon} {crypto.name} ({crypto.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
                      <input 
                        type="number" 
                        value={buyForm.amount}
                        onChange={(e) => setBuyForm({...buyForm, amount: e.target.value})}
                        placeholder="100.00"
                        min="10"
                        step="0.01"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum: $10.00</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <select 
                        value={buyForm.paymentMethod}
                        onChange={(e) => setBuyForm({...buyForm, paymentMethod: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">Choose payment method...</option>
                        <option value="Credit/Debit Card">Credit/Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Apple Pay">Apple Pay</option>
                      </select>
                    </div>
                    
                    {buyForm.cryptocurrency && buyForm.amount && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">Order Summary</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Purchase Amount:</span>
                            <span>${buyForm.amount} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exchange Fee (~1%):</span>
                            <span>${(parseFloat(buyForm.amount || 0) * 0.01).toFixed(2)} USD</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Total Cost:</span>
                            <span>${(parseFloat(buyForm.amount || 0) * 1.01).toFixed(2)} USD</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <div className="flex space-x-3">
                        <button 
                          type="button"
                          onClick={closeModal}
                          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={buyLoading}
                          className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {buyLoading ? 'Processing...' : 'Buy Crypto'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Settings Modal */}
            {activeModal === 'settings' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-full mr-3">
                      <Settings className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                      <p className="text-sm text-gray-500">Manage your preferences</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-6 h-6 transform rotate-45" />
                  </button>
                </div>

                {settingsError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{settingsError}</p>
                  </div>
                )}
                
                {/* Settings Navigation Tabs */}
                <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                  <nav className="flex space-x-4 min-w-max">
                    {[
                      { id: 'general', name: 'General', icon: '⚙️' },
                      { id: 'notifications', name: 'Notifications', icon: '🔔' },
                      { id: 'security', name: 'Security', icon: '🔒' },
                      { id: 'trading', name: 'Trading', icon: '💹' },
                      { id: 'account', name: 'Account', icon: '👤' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id)}
                        className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                          activeSettingsTab === tab.id
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-base">{tab.icon}</span>
                        <span>{tab.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Settings Content */}
                <div className="space-y-6 max-h-[50vh] overflow-y-auto">
                  {/* General Settings */}
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Display Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-700 font-medium">Show Balances</span>
                              <p className="text-sm text-gray-500">Display wallet balances and amounts</p>
                            </div>
                            <button 
                              onClick={() => updateUserSetting('showBalances', !userSettings.showBalances)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                userSettings.showBalances ? 'bg-orange-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                userSettings.showBalances ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">Default Currency</label>
                            <select 
                              value={userSettings.defaultCurrency}
                              onChange={(e) => updateUserSetting('defaultCurrency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                              <option value="CAD">CAD - Canadian Dollar</option>
                              <option value="AUD">AUD - Australian Dollar</option>
                              <option value="JPY">JPY - Japanese Yen</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Exchange Connections</h3>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-700 font-medium">Connected Exchanges</span>
                            <p className="text-sm text-gray-500">{exchanges.length === 0 ? 'No exchanges connected' : `${exchanges.length} exchange${exchanges.length > 1 ? 's' : ''} connected`}</p>
                          </div>
                          <button 
                            onClick={openExchangeConnection}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Notifications Settings */}
                  {activeSettingsTab === 'notifications' && (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Notification Channels</h3>
                        <div className="space-y-4">
                          {[
                            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                            { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push notifications' },
                            { key: 'sms', label: 'SMS Notifications', desc: 'Text message notifications for critical alerts' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <span className="text-gray-700 font-medium">{item.label}</span>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                              </div>
                              <button 
                                onClick={() => updateUserSetting(`notifications.${item.key}`, !userSettings.notifications[item.key])}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                  userSettings.notifications[item.key] ? 'bg-orange-600' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  userSettings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Notification Types</h3>
                        <div className="space-y-4">
                          {[
                            { key: 'trading', label: 'Trading Activities', desc: 'Buy/sell orders, trades, and market alerts' },
                            { key: 'security', label: 'Security Alerts', desc: 'Login attempts, password changes, and security events' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <span className="text-gray-700 font-medium">{item.label}</span>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                              </div>
                              <button 
                                onClick={() => updateUserSetting(`notifications.${item.key}`, !userSettings.notifications[item.key])}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                  userSettings.notifications[item.key] ? 'bg-orange-600' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  userSettings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Security Settings */}
                  {activeSettingsTab === 'security' && (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Account Security</h3>
                        <div className="space-y-4">
                          <button 
                            onClick={() => setShowPasswordChange(true)}
                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-gray-700 font-medium">Change Password</span>
                                <p className="text-sm text-gray-500">Update your account password</p>
                              </div>
                              <span className="text-gray-400">›</span>
                            </div>
                          </button>
                          
                          <button 
                            onClick={handle2FASetup}
                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-gray-700 font-medium">Two-Factor Authentication</span>
                                <p className={`text-sm ${
                                  userSettings.security?.twoFactorEnabled 
                                    ? 'text-green-600' 
                                    : 'text-red-500'
                                }`}>
                                  {userSettings.security?.twoFactorEnabled 
                                    ? 'Enabled ✓' 
                                    : 'Not enabled - Recommended'
                                  }
                                </p>
                              </div>
                              <span className="text-gray-400">›</span>
                            </div>
                          </button>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Security Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-700 font-medium">Login Notifications</span>
                              <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                            </div>
                            <button 
                              onClick={() => updateUserSetting('security.loginNotifications', !userSettings.security?.loginNotifications)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                userSettings.security?.loginNotifications ? 'bg-orange-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                userSettings.security?.loginNotifications ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">Session Timeout (minutes)</label>
                            <select 
                              value={userSettings.security?.sessionTimeout || 30}
                              onChange={(e) => updateUserSetting('security.sessionTimeout', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                              <option value={240}>4 hours</option>
                            </select>
                            <p className="text-sm text-gray-500 mt-1">Auto-logout after inactivity</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                        <div className="space-y-4">
                          {[
                            { key: 'showPortfolio', label: 'Show Portfolio', desc: 'Display portfolio information in app' },
                            { key: 'showActivity', label: 'Show Activity', desc: 'Display recent trading activity' },
                            { key: 'dataSharing', label: 'Analytics Data Sharing', desc: 'Share anonymous usage data to improve the app' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <span className="text-gray-700 font-medium">{item.label}</span>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                              </div>
                              <button 
                                onClick={() => updateUserSetting(`privacy.${item.key}`, !userSettings.privacy[item.key])}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                  userSettings.privacy[item.key] ? 'bg-orange-600' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                  userSettings.privacy[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Trading Settings */}
                  {activeSettingsTab === 'trading' && (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Trading Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-700 font-medium">Order Confirmations</span>
                              <p className="text-sm text-gray-500">Require confirmation before executing orders</p>
                            </div>
                            <button 
                              onClick={() => updateUserSetting('trading.confirmations', !userSettings.trading?.confirmations)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                userSettings.trading?.confirmations ? 'bg-orange-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                userSettings.trading?.confirmations ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-700 font-medium">Auto Slippage</span>
                              <p className="text-sm text-gray-500">Automatically set slippage tolerance</p>
                            </div>
                            <button 
                              onClick={() => updateUserSetting('trading.autoSlippage', !userSettings.trading?.autoSlippage)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                userSettings.trading?.autoSlippage ? 'bg-orange-600' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                userSettings.trading?.autoSlippage ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">Max Slippage Tolerance (%)</label>
                            <input 
                              type="number"
                              value={userSettings.trading?.maxSlippage || 1.0}
                              onChange={(e) => updateUserSetting('trading.maxSlippage', parseFloat(e.target.value) || 1.0)}
                              min="0.1"
                              max="50"
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">Maximum price deviation allowed for trades (0.1% - 50%)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Account Settings */}
                  {activeSettingsTab === 'account' && (
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Profile Information</h3>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                          <div>
                            <span className="text-gray-700 font-medium">{user?.firstName} {user?.lastName}</span>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={openProfileEdit}
                          className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">Edit Profile</span>
                            <span className="text-gray-400">›</span>
                          </div>
                        </button>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">App Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2">
                            <span className="text-gray-700">App Version</span>
                            <span className="text-gray-500 text-sm">1.0.0</span>
                          </div>
                          <div className="flex items-center justify-between p-2">
                            <span className="text-gray-700">Total Wallets</span>
                            <span className="text-gray-500 text-sm">{wallets.length}</span>
                          </div>
                          <div className="flex items-center justify-between p-2">
                            <span className="text-gray-700">Connected Exchanges</span>
                            <span className="text-gray-500 text-sm">{exchanges.length}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => alert('📧 Contact Support\n\nGet help with:\n• Technical issues\n• Account problems\n• Trading questions\n• Feature requests\n\nSupport available 24/7 via:\n• Email: support@cryptowallet.com\n• Live chat\n• Help center')}
                          className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mt-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">Contact Support</span>
                            <span className="text-gray-400">›</span>
                          </div>
                        </button>
                      </div>
                      
                      <div className="border border-red-200 rounded-lg p-4">
                        <h3 className="font-semibold text-red-700 mb-4">Danger Zone</h3>
                        <div className="space-y-3">
                          <button 
                            onClick={resetSettings}
                            className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                          >
                            Reset All Settings
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to logout?')) {
                                handleLogout();
                                closeModal();
                              }
                            }}
                            className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Settings Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                  <button 
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveSettings}
                    disabled={settingsLoading}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full mr-3">
                    <Settings className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                    <p className="text-sm text-gray-500">Update your account password</p>
                  </div>
                </div>
                <button onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{passwordError}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={passwordLoading}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {passwordLoading ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-3">
                    <Settings className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Setup Two-Factor Authentication</h2>
                    <p className="text-sm text-gray-500">Enhance your account security</p>
                  </div>
                </div>
                <button onClick={() => setShow2FASetup(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable 2FA Protection</h3>
                  <p className="text-gray-600 text-sm">Two-factor authentication adds an extra layer of security to your account.</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">✨ What you&apos;ll get:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Google Authenticator integration</li>
                    <li>• SMS backup verification</li>
                    <li>• Recovery codes for emergencies</li>
                    <li>• Protection against unauthorized access</li>
                    <li>• Required for sensitive operations</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important:</h4>
                  <p className="text-sm text-yellow-800">Make sure to save your backup codes in a secure location. You&apos;ll need them if you lose access to your authenticator device.</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => setShow2FASetup(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={complete2FASetup}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Setup 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                    <p className="text-sm text-gray-500">Update your account information</p>
                  </div>
                </div>
                <button onClick={() => {
                  setShowProfileEdit(false);
                  setProfileForm({ firstName: '', lastName: '', email: '', phone: '', timezone: 'UTC' });
                  setProfileError('');
                }} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>

              {profileError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{profileError}</p>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Email changes require verification</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select 
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({...profileForm, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-1">🔒 Privacy Note</h4>
                  <p className="text-sm text-blue-800">Your personal information is encrypted and stored securely. We never share your data with third parties.</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowProfileEdit(false);
                        setProfileForm({ firstName: '', lastName: '', email: '', phone: '', timezone: 'UTC' });
                        setProfileError('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={profileLoading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {profileLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Manager Modal */}
      {showExchangeManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Connect to Exchange</h2>
                    <p className="text-sm text-gray-500">Choose an exchange to connect for trading and portfolio management</p>
                  </div>
                </div>
                <button 
                  onClick={closeExchangeManager} 
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>

              {/* Current Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Current Status</h3>
                    <p className="text-sm text-gray-600">
                      {exchanges.length === 0 
                        ? 'No exchanges connected' 
                        : `Connected to ${exchanges.length} exchange${exchanges.length > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    exchanges.length > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {exchanges.length > 0 ? 'Connected' : 'Setup Required'}
                  </div>
                </div>
              </div>

              {/* Connected Exchanges */}
              {exchanges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Connected Exchanges</h3>
                  <div className="space-y-2">
                    {exchanges.map((exchange, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-green-900 capitalize">{exchange.name}</p>
                            {exchange.label && (
                              <p className="text-sm text-green-700">{exchange.label}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-green-700 font-medium">Active</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Exchanges */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Exchanges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableExchanges.map((exchange) => (
                    <div key={exchange.name} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{exchange.displayName}</h4>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          exchanges.some(e => e.name === exchange.name)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {exchanges.some(e => e.name === exchange.name) ? 'Connected' : 'Available'}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{exchange.description}</p>
                      
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Supported Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {exchange.supportedFeatures.map((feature) => (
                            <span key={feature} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Required Credentials:</p>
                        <div className="flex flex-wrap gap-1">
                          {exchange.requiredCredentials.map((cred) => (
                            <span key={cred} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {cred === 'apiKey' ? 'API Key' : cred === 'secretKey' ? 'Secret Key' : 'Passphrase'}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleExchangeConnection(exchange)}
                        disabled={exchanges.some(e => e.name === exchange.name)}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          exchanges.some(e => e.name === exchange.name)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {exchanges.some(e => e.name === exchange.name) ? 'Already Connected' : 'Connect Exchange'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 How to Connect</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Choose an exchange from the list above</li>
                  <li>2. Create API credentials on the exchange website</li>
                  <li>3. Enter your API credentials securely</li>
                  <li>4. Test the connection</li>
                  <li>5. Start buying crypto directly from your wallet!</li>
                </ol>
              </div>

              {/* Security Notice */}
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">🔒 Security Guaranteed</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• All API credentials are encrypted and stored securely</p>
                  <p>• We never store your exchange passwords</p>
                  <p>• Connection testing ensures credentials work before saving</p>
                  <p>• You can disconnect any exchange at any time</p>
                </div>
              </div>

              {/* Connection Form Modal */}
              {selectedExchangeForConnection && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Plus className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Connect {selectedExchangeForConnection.displayName}</h3>
                            <p className="text-sm text-gray-500">Enter your API credentials</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedExchangeForConnection(null)} 
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="w-5 h-5 transform rotate-45" />
                        </button>
                      </div>

                      {connectionError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">{connectionError}</p>
                        </div>
                      )}

                      <form onSubmit={connectToExchange} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Label (Optional)</label>
                          <input
                            type="text"
                            value={connectionCredentials.label}
                            onChange={(e) => setConnectionCredentials({...connectionCredentials, label: e.target.value})}
                            placeholder="e.g., Main Account"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
                          <div className="relative">
                            <input
                              type={showCredentialFields.apiKey ? 'text' : 'password'}
                              value={connectionCredentials.apiKey}
                              onChange={(e) => setConnectionCredentials({...connectionCredentials, apiKey: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => toggleCredentialVisibility('apiKey')}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showCredentialFields.apiKey ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key *</label>
                          <div className="relative">
                            <input
                              type={showCredentialFields.secretKey ? 'text' : 'password'}
                              value={connectionCredentials.secretKey}
                              onChange={(e) => setConnectionCredentials({...connectionCredentials, secretKey: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => toggleCredentialVisibility('secretKey')}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showCredentialFields.secretKey ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        {selectedExchangeForConnection.requiredCredentials.includes('passphrase') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passphrase *</label>
                            <div className="relative">
                              <input
                                type={showCredentialFields.passphrase ? 'text' : 'password'}
                                value={connectionCredentials.passphrase}
                                onChange={(e) => setConnectionCredentials({...connectionCredentials, passphrase: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => toggleCredentialVisibility('passphrase')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                              >
                                {showCredentialFields.passphrase ? '🙈' : '👁️'}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sandbox"
                            checked={connectionCredentials.sandbox}
                            onChange={(e) => setConnectionCredentials({...connectionCredentials, sandbox: e.target.checked})}
                            className="mr-2"
                          />
                          <label htmlFor="sandbox" className="text-sm text-gray-700">Use Sandbox/Testnet</label>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h5 className="font-medium text-yellow-800 text-sm mb-1">📋 Quick Setup Guide</h5>
                          <ol className="text-xs text-yellow-700 space-y-1">
                            <li>1. Visit {selectedExchangeForConnection.displayName} API settings</li>
                            <li>2. Create new API key with trading permissions</li>
                            <li>3. Copy the credentials and paste them above</li>
                            <li>4. We&apos;ll test the connection before saving</li>
                          </ol>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button 
                            type="button"
                            onClick={() => setSelectedExchangeForConnection(null)}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={connectionLoading || !connectionCredentials.apiKey || !connectionCredentials.secretKey}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                          >
                            {connectionLoading ? 'Connecting...' : 'Connect & Test'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
