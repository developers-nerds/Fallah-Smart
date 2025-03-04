const { Transactions, Accounts, Category } = require('../database/assossiation');

const transactionController = {
  // Get all transactions for an account
  getAllTransactions: async (req, res) => {
    try {
      const { accountId } = req.params;

      // Verify account exists and belongs to user
      const account = await Accounts.findOne({
        where: {
          id: accountId,
          userId: req.user.id,
        },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found or does not belong to user',
        });
      }

      const transactions = await Transactions.findAll({
        where: { accountId },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name','type','icon','color']
          },
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency']
          }
        ],
        order: [['date', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Create new transaction
  createTransaction: async (req, res) => {
    try {
      const { accountId, categoryId, amount, type, description, date } = req.body;

      if (!accountId || !amount || !type || !categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: accountId, categoryId, amount, and type are required'
        });
      }

      // Verify account belongs to user
      const account = await Accounts.findOne({
        where: { 
          id: accountId,
          userId: req.user.id
        }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found or does not belong to user'
        });
      }

      // Verify category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Create transaction
      const transaction = await Transactions.create({
        accountId,
        categoryId,
        amount,
        type,
        description,
        date: date || new Date(),
        userId: req.user.id
      });

      // Update account balance
      const newBalance = type === 'income' 
        ? account.balance + amount 
        : account.balance - amount;
      
      await account.update({ balance: newBalance });

      // Fetch complete transaction with associations
      const completeTransaction = await Transactions.findByPk(transaction.id, {
        include: [
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: completeTransaction
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update transaction
  updateTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { accountId, categoryId, amount, type, description, date } = req.body;

      const transaction = await Transactions.findOne({
        where: {
          id: transactionId,
          userId: req.user.id,
        },
        include: [{ 
          model: Accounts, 
          as: 'account',
          where: { userId: req.user.id }
        }]
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Verify new accountId if provided
      if (accountId && accountId !== transaction.accountId) {
        const account = await Accounts.findOne({
          where: {
            id: accountId,
            userId: req.user.id,
          },
        });
        if (!account) {
          return res.status(404).json({
            success: false,
            message: 'New account not found or does not belong to user'
          });
        }
      }

      // Verify new categoryId if provided
      if (categoryId && categoryId !== transaction.categoryId) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'New category not found'
          });
        }
      }

      // Update transaction
      await transaction.update({
        accountId: accountId || transaction.accountId,
        categoryId: categoryId || transaction.categoryId,
        amount: amount || transaction.amount,
        type: type || transaction.type,
        description: description || transaction.description,
        date: date || transaction.date,
      });

      // Fetch updated transaction with associations
      const updatedTransaction = await Transactions.findByPk(transaction.id, {
        include: [
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: updatedTransaction
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Delete transaction
  deleteTransaction: async (req, res) => {
    try {
      const transaction = await Transactions.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Accounts,
            as: 'account',
            where: { userId: req.user.id }
          },
          {
            model: Category,
            as: 'category'
          }
        ]
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Revert account balance
      const account = transaction.account;
      const balanceAdjustment = transaction.type === 'income' 
        ? -transaction.amount 
        : transaction.amount;
      
      await account.update({ 
        balance: account.balance + balanceAdjustment 
      });

      await transaction.destroy();
      return res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = transactionController;