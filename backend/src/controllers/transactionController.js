const { Transactions, Accounts, Category } = require('../database/assossiation');
const { Op } = require('sequelize');

const transactionController = {
  // Get transactions by account and time interval
  getAllTransactions: async (req, res) => {
    try {
      const { accountId } = req.params;
      const { interval = 'month', startDate, endDate } = req.query; // Default to 'month' if no interval provided

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

      // Construct date range based on interval
      let whereClause = { accountId };
      const now = new Date();

      switch (interval.toLowerCase()) {
        case 'daily':
          whereClause.date = {
            [Op.gte]: new Date(now.setHours(0, 0, 0, 0)),
            [Op.lte]: new Date(now.setHours(23, 59, 59, 999)),
          };
          break;
        case 'weekly':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          whereClause.date = {
            [Op.gte]: new Date(startOfWeek.setHours(0, 0, 0, 0)),
            [Op.lte]: new Date(startOfWeek.setDate(startOfWeek.getDate() + 6)).setHours(23, 59, 59, 999),
          };
          break;
        case 'monthly':
          if (startDate && endDate) {
            // Use provided startDate and endDate
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return res.status(400).json({
                success: false,
                message: 'Invalid startDate or endDate format. Dates must be in ISO format (e.g., "2023-10-01T00:00:00.000Z").',
              });
            }
            whereClause.date = {
              [Op.gte]: start,
              [Op.lte]: end,
            };
          } else {
            // Default to current month if no dates provided
            whereClause.date = {
              [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1),
              [Op.lte]: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
            };
          }
          break;
        case 'yearly':
          if (startDate && endDate) {
            // Use provided startDate and endDate
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return res.status(400).json({
                success: false,
                message: 'Invalid startDate or endDate format. Dates must be in ISO format (e.g., "2023-01-01T00:00:00.000Z").',
              });
            }
            whereClause.date = {
              [Op.gte]: start,
              [Op.lte]: end,
            };
          } else {
            // Default to current year if no dates provided
            whereClause.date = {
              [Op.gte]: new Date(now.getFullYear(), 0, 1),
              [Op.lte]: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
            };
          }
          break;
        case 'all':
          whereClause.date = { [Op.gte]: new Date(0) }; // From the beginning of time
          break;
        case 'interval':
          if (!startDate || !endDate) {
            return res.status(400).json({
              success: false,
              message: 'startDate and endDate are required for interval',
            });
          }
          const startInterval = new Date(startDate);
          const endInterval = new Date(endDate);
          if (isNaN(startInterval.getTime()) || isNaN(endInterval.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Invalid startDate or endDate format. Dates must be in ISO format (e.g., "2023-01-01T00:00:00.000Z").',
            });
          }
          whereClause.date = {
            [Op.gte]: startInterval,
            [Op.lte]: endInterval,
          };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid interval',
          });
      }

      // Fetch transactions with associated categories and accounts
      const transactions = await Transactions.findAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'type', 'icon', 'color'],
          },
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency'],
          },
        ],
        order: [['date', 'DESC']],
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
        error: error.message,
      });
    }
  },

  // Create new transaction
  createTransaction: async (req, res) => {
    try {
      const { accountId, categoryId, amount, type, note, date } = req.body;

      if (!accountId || !amount || !type || !categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: accountId, categoryId, amount, and type are required',
        });
      }

      // Verify account belongs to user
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

      // Verify category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      // Create transaction
      const transaction = await Transactions.create({
        accountId,
        categoryId,
        amount,
        type,
        note,
        date: date || new Date(),
        userId: req.user.id,
      });

      // Update account balance
      const newBalance =
        type === 'income' ? account.balance + amount : account.balance - amount;

      await account.update({ balance: newBalance });

      // Fetch complete transaction with associations
      const completeTransaction = await Transactions.findByPk(transaction.id, {
        include: [
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency'],
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: completeTransaction,
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Update transaction
  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { accountId, categoryId, amount, type, note, date } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required',
        });
      }

      // Find transaction through account association instead of direct userId
      const transaction = await Transactions.findOne({
        where: { id: id },
        include: [
          {
            model: Accounts,
            as: 'account',
            where: { userId: req.user.id },
          },
        ],
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
      }

      // Store original values for balance calculation
      const originalAmount = transaction.amount;
      const originalType = transaction.type;
      const originalAccountId = transaction.accountId;

      // Verify new accountId if provided
      let newAccount = transaction.account;
      if (accountId && accountId !== transaction.accountId) {
        newAccount = await Accounts.findOne({
          where: {
            id: accountId,
            userId: req.user.id,
          },
        });
        if (!newAccount) {
          return res.status(404).json({
            success: false,
            message: 'New account not found or does not belong to user',
          });
        }
      }

      // Verify new categoryId if provided
      if (categoryId && categoryId !== transaction.categoryId) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'New category not found',
          });
        }
      }

      // Revert the effect of the original transaction
      const originalBalanceAdjustment =
        originalType === 'income' ? -originalAmount : originalAmount;

      await transaction.account.update({
        balance: transaction.account.balance + originalBalanceAdjustment,
      });

      // Update transaction
      await transaction.update({
        accountId: accountId || transaction.accountId,
        categoryId: categoryId || transaction.categoryId,
        amount: amount || transaction.amount,
        type: type || transaction.type,
        note: note || transaction.note,
        date: date || transaction.date,
      });

      // Apply the effect of the new transaction
      const newAmount = amount || originalAmount;
      const newType = type || originalType;
      const newBalanceAdjustment = newType === 'income' ? newAmount : -newAmount;

      await newAccount.update({
        balance: newAccount.balance + newBalanceAdjustment,
      });

      // Fetch updated transaction with associations
      const updatedTransaction = await Transactions.findByPk(transaction.id, {
        include: [
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency'],
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
      });

      return res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: updatedTransaction,
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
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
            where: { userId: req.user.id },
          },
          {
            model: Category,
            as: 'category',
          },
        ],
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
      }

      // Revert account balance
      const account = transaction.account;
      const balanceAdjustment =
        transaction.type === 'income' ? -transaction.amount : transaction.amount;

      await account.update({
        balance: account.balance + balanceAdjustment,
      });

      await transaction.destroy();
      return res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get all users' transactions and balances (Admin only)
  // Get all transactions for a specific account
  getAllUsersTransactions: async (req, res) => {
    try {
      const { accountId } = req.params;

      // Fetch transactions for the specific account
      const transactions = await Transactions.findAll({
        where: { accountId },
        include: [
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency', 'userId'],
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'type', 'icon', 'color'],
          },
        ],
        order: [['date', 'DESC']],
      });

      // Get the specific account details
      const account = await Accounts.findOne({
        where: { id: accountId },
        attributes: ['id', 'Methods', 'balance', 'currency', 'userId'],
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          transactions,
          account,
        },
      });
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get all transactions from all accounts (Admin only)
  getAllTransactionsAdmin: async (req, res) => {
    try {
      // Fetch all transactions with their associated accounts and categories
      const transactions = await Transactions.findAll({
        include: [
          {
            model: Accounts,
            as: 'account',
            attributes: ['id', 'Methods', 'balance', 'currency', 'userId'],
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'type', 'icon', 'color'],
          },
        ],
        order: [['date', 'DESC']],
      });

      // Get all accounts
      const accounts = await Accounts.findAll({
        attributes: ['id', 'Methods', 'balance', 'currency', 'userId'],
      });

      return res.status(200).json({
        success: true,
        data: {
          transactions,
          accounts,
        },
      });
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },
};

module.exports = transactionController;