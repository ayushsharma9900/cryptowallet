// Simple in-memory storage for demo purposes
// In production, this would be replaced with a proper database

class MemoryStorage {
  constructor() {
    this.users = [];
    this.wallets = [];
    this.transactions = [];
  }

  // User methods
  findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: this.users.length + 1,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.users[userIndex];
  }

  // Wallet methods
  findWalletsByUserId(userId) {
    return this.wallets.filter(wallet => wallet.userId === userId);
  }

  createWallet(walletData) {
    const newWallet = {
      id: this.wallets.length + 1,
      ...walletData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.wallets.push(newWallet);
    return newWallet;
  }

  // Transaction methods
  findTransactionsByWalletId(walletId) {
    return this.transactions.filter(tx => tx.walletId === walletId);
  }

  createTransaction(transactionData) {
    const newTransaction = {
      id: this.transactions.length + 1,
      ...transactionData,
      createdAt: new Date().toISOString()
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  // Get all data (for debugging)
  getAllData() {
    return {
      users: this.users.map(user => ({...user, password: '[HIDDEN]'})),
      wallets: this.wallets,
      transactions: this.transactions
    };
  }
}

// Create a singleton instance
const storage = new MemoryStorage();

export default storage;