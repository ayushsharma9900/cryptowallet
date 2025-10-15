# 🚀 CryptoWallet - PayPal-like Crypto Payment App

A comprehensive cryptocurrency wallet and payment platform similar to PayPal, built with **Next.js** and **Node.js**. This application supports multiple cryptocurrencies, secure wallet management, and real-time transactions.

## ✨ Features

### Core Features
- 🔐 **User Authentication & Profile Management**
  - User registration and login
  - JWT-based authentication
  - Two-factor authentication (2FA)
  - Secure password management
  - Profile customization

- 💼 **Multi-Wallet Management**
  - Support for 10+ cryptocurrencies (BTC, ETH, USDT, USDC, LTC, etc.)
  - Hot, cold, and watch-only wallets
  - Primary wallet designation
  - Wallet import/export functionality
  - HD wallet support with mnemonic phrases

- 💸 **Send & Receive Payments**
  - Instant crypto transfers
  - QR code generation for easy receiving
  - Contact management for frequent recipients
  - Transaction categorization
  - Real-time balance updates

- 📊 **Portfolio & Analytics**
  - Total portfolio value tracking
  - Real-time price updates
  - Transaction history with filtering
  - Balance visibility controls
  - Performance analytics

### Security Features
- 🛡️ **Advanced Security**
  - Private key encryption
  - Two-factor authentication (TOTP)
  - Transaction limits and controls
  - Rate limiting and DDoS protection
  - Secure backup codes

- 🔒 **Privacy & Compliance**
  - GDPR-compliant data handling
  - Optional balance hiding
  - Encrypted data storage
  - Audit trails

### Additional Features
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Real-time Updates** - WebSocket integration for live notifications
- 🌐 **Multi-language Support** - Support for 9+ languages
- 💰 **Multiple Fiat Currencies** - USD, EUR, GBP, JPY, CAD, AUD
- 📧 **Email Notifications** - Transaction alerts and security notifications

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Socket.IO** - Real-time communication
- **JWT** - JSON Web Tokens for authentication

### Blockchain Integration
- **Bitcoin.js** - Bitcoin wallet operations
- **Ethers.js** - Ethereum and ERC-20 token support
- **Web3.js** - Blockchain connectivity
- **Custom crypto utilities** - Multi-chain support

### Security & Utilities
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **Rate limiting** - Request throttling
- **Speakeasy** - Two-factor authentication
- **QR Code** - QR code generation

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- Git for version control

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cryptowallet
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration
Copy the example environment file and update with your settings:

```bash
# In the server directory
cd server
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/crypto-wallet

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Encryption Key (32 characters)
ENCRYPTION_KEY=your32characterencryptionkeyhere

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows (if installed as service)
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 5. Run the Application

#### Development Mode
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:

# Start backend server (from root directory)
cd server
npm run dev

# Start frontend (from root directory, new terminal)
cd client
npm run dev
```

#### Production Mode
```bash
# Build the frontend
cd client
npm run build

# Start the production server
cd ../server
npm start
```

## 📱 Usage

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health

### Getting Started
1. **Create Account**: Register with email and password
2. **Add Wallets**: Create or import crypto wallets
3. **Fund Wallets**: Add cryptocurrency to your wallets
4. **Send/Receive**: Start making crypto payments
5. **Manage Portfolio**: Track your investments and transactions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA

### Wallets
- `GET /api/wallets` - Get user wallets
- `POST /api/wallets` - Create new wallet
- `GET /api/wallets/:id` - Get specific wallet
- `PUT /api/wallets/:id` - Update wallet
- `DELETE /api/wallets/:id` - Delete wallet
- `GET /api/wallets/:id/balance` - Get wallet balance
- `GET /api/wallets/:id/transactions` - Get wallet transactions

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get user transactions
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction status

## 🛠️ Development

### Project Structure
```
# 🚀 CryptoWallet - PayPal-like Crypto Payment Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-blue.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-green.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org/)

A comprehensive crypto wallet and payment platform built with modern web technologies, featuring multi-cryptocurrency support, secure wallet management, and real-time transaction tracking.

## 🌟 Features

### 🔐 **Security & Authentication**
- JWT-based authentication with refresh tokens
- Two-Factor Authentication (2FA) support  
- Password hashing with bcryptjs
- Private key encryption with AES-256
- Rate limiting and brute force protection
- Account lockout mechanisms

### 💰 **Multi-Cryptocurrency Support**
- **Bitcoin (BTC)** - Bech32 and Legacy addresses
- **Ethereum (ETH)** - ERC-20 compatible
- **Stablecoins** - USDT, USDC
- **Altcoins** - LTC, BCH, ADA, DOT, LINK, XRP, BNB
- Automatic address validation for each currency
- Support for multiple networks (mainnet, testnet)

### 🏦 **Wallet Management**
- Generate secure HD wallets
- Import existing wallets
- Watch-only wallet support
- Multi-signature wallet compatibility
- Hardware wallet integration ready
- Primary wallet designation

### 📊 **Portfolio & Analytics**
- Real-time balance tracking
- USD value conversion
- Portfolio overview dashboard
- Transaction history
- Balance hiding for privacy
- Dynamic balance updates

## 🛠 Tech Stack

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bitcoinjs-lib & ethers.js** - Blockchain operations

### **Frontend**  
- **Next.js 15** - React framework with Turbopack
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible components
- **React Hook Form** - Form management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 7+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cryptowallet.git
   cd cryptowallet
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   Create `.env` file in root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/cryptowallet
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Encryption
   ENCRYPTION_KEY=your-32-character-encryption-key
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Start Development Servers**
   ```bash
   npm run dev  # Starts both client and server
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API Documentation: http://localhost:5000/api/docs

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile

### **Wallets**
- `GET /api/wallets` - Get user wallets
- `POST /api/wallets` - Create new wallet
- `GET /api/wallets/:id` - Get specific wallet

## 🔒 Security Features

- **Private Key Encryption**: All private keys encrypted with AES-256
- **JWT Security**: Short-lived access tokens with refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation for all inputs
- **Password Policy**: Strong password requirements

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This is a development project. For production use, implement proper security audits and key management.

---

**⚡ Built with modern web technologies for the future of digital payments ⚡**
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utility functions
│   ├── public/           # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── package.json
└── package.json          # Root package file
```

### Adding New Features
1. **Backend**: Add routes, controllers, and models
2. **Frontend**: Create components and pages
3. **Database**: Update models and migrations
4. **Testing**: Add unit and integration tests

### Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Bitcoin Cash (BCH)
- Cardano (ADA)
- Polkadot (DOT)
- Chainlink (LINK)
- Ripple (XRP)
- Binance Coin (BNB)
- Tether (USDT)
- USD Coin (USDC)

## 🔒 Security Considerations

- Private keys are encrypted before storage
- JWT tokens expire and can be refreshed
- Rate limiting prevents abuse
- Input validation on all endpoints
- CORS protection enabled
- Security headers with Helmet
- Two-factor authentication support
- Secure password hashing with bcrypt

## 🚨 Important Notes

⚠️ **This is a development/demo version**:
- Do not use with real cryptocurrency in production
- Private key generation is simplified
- Blockchain connectivity is mocked for demo
- Always use testnet for development
- Implement proper key management for production

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For questions or support, please open an issue in the repository.

---

**Happy crypto wallet development! 🚀**