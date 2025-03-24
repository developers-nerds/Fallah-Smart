const { Accounts, Users } = require('../database/assossiation');

const accountController = {
  // Add this new function at the beginning of the controller
  getAllAccountsWithUsers: async (req, res) => {
    try {
      const accounts = await Accounts.findAll({
        include: [{
          model: Users,
          as: 'User',  // Use the same alias defined in the association
          attributes: ['id', 'firstName', 'lastName', 'role']
        }]
      });
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts with users:', error);
      res.status(500).json({ message: 'Error fetching accounts with users', error: error.message });
    }
  },
  // Get all accounts for authenticated user
  getAllAccounts: async (req, res) => {
    try {
      const accounts = await Accounts.findAll({
        where: { userId: req.user.id }
      });
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: 'Error fetching accounts', error: error.message });
    }
  },

  // Create new account for authenticated user
  createAccount: async (req, res) => {
    try {
      const { Methods, balance, currency } = req.body;

      if (!Methods || !currency) {
        return res.status(400).json({ message: 'Method and currency are required' });
      }

      const account = await Accounts.create({
        userId: req.user.id,
        Methods,
        balance: balance || 0,
        currency
      });

      res.status(201).json(account);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: 'Error creating account', error: error.message });
    }
  },

  // Update authenticated user's account
  updateAccount: async (req, res) => {
    try {
      const { Methods, balance, currency } = req.body;
      
      const account = await Accounts.findOne({
        where: { userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      await account.update({
        Methods: Methods || account.Methods,
        balance: balance || account.balance,
        currency: currency || account.currency
      });

      res.json(account);
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({ message: 'Error updating account', error: error.message });
    }
  },

  // Delete authenticated user's account
  deleteAccount: async (req, res) => {
    try {
      const result = await Accounts.destroy({
        where: { userId: req.user.id }
      });

      if (!result) {
        return res.status(404).json({ message: 'Account not found' });
      }

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: 'Error deleting account', error: error.message });
    }
  },  // Add comma here

  // Update account balance
  updateAccountBalance: async (req, res) => {
    try {
      const { id } = req.params;
      const { balance, type, amount } = req.body;
  
      const account = await Accounts.findOne({
        where: { 
          id: id,
          userId: req.user.id 
        }
      });
  
      if (!account) {
        return res.status(404).json({ 
          success: false,
          message: 'Account not found or does not belong to user' 
        });
      }

      // Calculate new balance based on transaction type
      let newBalance = account.balance;
      if (type === 'Income') {
        newBalance = account.balance + amount;
      } else if (type === 'Expense') {
        newBalance = account.balance - amount;
      }
  
      await account.update({ balance: newBalance });
  
      res.json({
        success: true,
        balance: newBalance
      });
    } catch (error) {
      console.error('Error updating account balance:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating account balance', 
        error: error.message 
      });
    }
  }
};

module.exports = accountController;