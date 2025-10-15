const bitcoin = require('bitcoinjs-lib');
const { ethers } = require('ethers');
const crypto = require('crypto');
const ecc = require('tiny-secp256k1');

// Initialize ECPair with the ecc library
bitcoin.initEccLib(ecc);
const ECPair = require('ecpair').ECPairFactory(ecc);

// Encryption utilities
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY) : crypto.randomBytes(32);

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const { encrypted, iv } = encryptedData;
  
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Bitcoin utilities
const generateBitcoinWallet = (network = 'mainnet') => {
  const networkType = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  
  // Generate random private key
  const privateKeyBuffer = crypto.randomBytes(32);
  const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network: networkType });
  const privateKey = keyPair.toWIF();
  const publicKey = keyPair.publicKey.toString('hex');
  
  // Generate different address formats
  let p2pkh, p2wpkh;
  try {
    p2pkh = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: networkType });
    p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: networkType });
  } catch (error) {
    // Fallback: create a simple address using the hash160 of the public key
    const pubKeyHash = bitcoin.crypto.hash160(keyPair.publicKey);
    p2pkh = bitcoin.payments.p2pkh({ hash: pubKeyHash, network: networkType });
    p2wpkh = bitcoin.payments.p2wpkh({ hash: pubKeyHash, network: networkType });
  }
  
  return {
    privateKey,
    publicKey,
    address: p2wpkh.address || p2pkh.address, // Prefer Bech32 format
    legacyAddress: p2pkh.address,
    segwitAddress: p2wpkh.address,
    network
  };
};

const validateBitcoinAddress = (address, network = 'mainnet') => {
  try {
    const networkType = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    bitcoin.address.toOutputScript(address, networkType);
    return true;
  } catch (error) {
    return false;
  }
};

// Ethereum utilities
const generateEthereumWallet = (network = 'mainnet') => {
  const wallet = ethers.Wallet.createRandom();
  
  return {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
    mnemonic: wallet.mnemonic?.phrase || null,
    network
  };
};

const validateEthereumAddress = (address) => {
  return ethers.isAddress(address);
};

// HD Wallet utilities
const generateMnemonic = () => {
  const entropy = crypto.randomBytes(32);
  // This would typically use a BIP39 library for proper mnemonic generation
  return entropy.toString('hex'); // Simplified for demo
};

const deriveWalletFromMnemonic = (mnemonic, path = "m/44'/0'/0'/0/0", cryptocurrency = 'BTC') => {
  // This would typically use HDNode derivation
  // For demo purposes, generating a new wallet
  switch (cryptocurrency) {
    case 'BTC':
      return generateBitcoinWallet();
    case 'ETH':
      return generateEthereumWallet();
    default:
      throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
  }
};

// Address validation
const validateAddress = (address, cryptocurrency, network = 'mainnet') => {
  switch (cryptocurrency) {
    case 'BTC':
      return validateBitcoinAddress(address, network);
    case 'ETH':
    case 'USDT':
    case 'USDC':
    case 'LINK':
    case 'BNB':
      return validateEthereumAddress(address);
    case 'LTC':
      // Litecoin validation (similar to Bitcoin)
      return validateBitcoinAddress(address, network);
    default:
      return false;
  }
};

// Get address format info
const getAddressInfo = (address, cryptocurrency) => {
  const info = {
    isValid: validateAddress(address, cryptocurrency),
    cryptocurrency,
    type: 'unknown'
  };

  if (!info.isValid) return info;

  switch (cryptocurrency) {
    case 'BTC':
      if (address.startsWith('1')) {
        info.type = 'P2PKH';
        info.description = 'Legacy Bitcoin address';
      } else if (address.startsWith('3')) {
        info.type = 'P2SH';
        info.description = 'Script hash address';
      } else if (address.startsWith('bc1')) {
        info.type = 'P2WPKH';
        info.description = 'Bech32 segwit address';
      }
      break;
    case 'ETH':
    case 'USDT':
    case 'USDC':
    case 'LINK':
    case 'BNB':
      info.type = 'Ethereum';
      info.description = 'Ethereum address';
      info.checksummed = ethers.getAddress(address);
      break;
  }

  return info;
};

// Transaction utilities
const estimateTransactionFee = async (cryptocurrency, network = 'mainnet') => {
  // This would typically call external APIs for fee estimation
  const fees = {
    BTC: {
      slow: 10,    // sat/byte
      medium: 20,  // sat/byte
      fast: 50     // sat/byte
    },
    ETH: {
      slow: '20000000000',    // 20 gwei
      medium: '30000000000',  // 30 gwei
      fast: '50000000000'     // 50 gwei
    }
  };

  return fees[cryptocurrency] || { slow: 0, medium: 0, fast: 0 };
};

// Security utilities
const generateSecureRandom = (bytes = 32) => {
  return crypto.randomBytes(bytes);
};

const hashData = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(data).digest('hex');
};

// Format utilities
const formatCryptoAmount = (amount, cryptocurrency) => {
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
  };

  const decimal = decimals[cryptocurrency] || 18;
  const divisor = Math.pow(10, decimal);
  
  return (parseFloat(amount) / divisor).toFixed(8);
};

const parseCryptoAmount = (amount, cryptocurrency) => {
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
  };

  const decimal = decimals[cryptocurrency] || 18;
  const multiplier = Math.pow(10, decimal);
  
  return Math.floor(parseFloat(amount) * multiplier).toString();
};

module.exports = {
  // Encryption
  encrypt,
  decrypt,
  
  // Wallet generation
  generateBitcoinWallet,
  generateEthereumWallet,
  generateMnemonic,
  deriveWalletFromMnemonic,
  
  // Address validation
  validateAddress,
  validateBitcoinAddress,
  validateEthereumAddress,
  getAddressInfo,
  
  // Transaction utilities
  estimateTransactionFee,
  
  // Security
  generateSecureRandom,
  hashData,
  
  // Formatting
  formatCryptoAmount,
  parseCryptoAmount
};