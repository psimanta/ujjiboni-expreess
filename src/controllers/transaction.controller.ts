import { Request, Response } from 'express';
import { Transaction, TransactionType, Account, type ITransaction } from '../models';
import { Types } from 'mongoose';

// GET /transactions - Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { accountId, type, enteredBy, page = 1, limit = 10 } = req.query;

    // Build query object
    const query: any = {};
    if (accountId) {
      query.accountId = accountId;
    }
    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      query.type = type;
    }
    if (enteredBy) {
      query.enteredBy = new RegExp(enteredBy as string, 'i');
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query with pagination and populate account details
    const transactions = await Transaction.find(query)
      .populate('accountId', 'name accountHolder')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    return res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /transactions/:id - Get transaction by ID
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('accountId');

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: `Transaction with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({ transaction });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch transaction',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /transactions/account/:accountId - Get transactions by account ID
export const getTransactionsByAccount = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { type, page = 1, limit = 10 } = req.query;

    // Verify account exists
    const accountExists = await Account.findById(accountId);
    if (!accountExists) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${accountId} does not exist`,
      });
    }

    // Build query
    const query: any = { accountId };
    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Transaction.find(query)
      .populate('accountId', 'name accountHolder')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    return res.json({
      success: true,
      message: 'Transactions fetched successfully',
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch account transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /transactions/account/:accountId/balance - Get account balance
export const getAccountBalance = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    // Verify account exists
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${accountId} does not exist`,
      });
    }

    const balanceData = await Transaction.getAccountBalance(new Types.ObjectId(accountId));
    const summaryData = await Transaction.getAccountSummary(new Types.ObjectId(accountId));

    const balance =
      balanceData.length > 0
        ? balanceData[0]
        : {
            balance: 0,
            totalTransactions: 0,
            lastTransaction: null,
          };

    // Transform summary data for easier consumption
    const summary = summaryData.reduce((acc: any, item: any) => {
      acc[item._id] = {
        total: item.total,
        count: item.count,
      };
      return acc;
    }, {});

    return res.json({
      success: true,
      message: 'Account balance fetched successfully',
      account: {
        id: account._id,
        name: account.name,
        accountHolder: account.accountHolder,
      },
      balance: balance.balance,
      totalTransactions: balance.totalTransactions,
      lastTransaction: balance.lastTransaction,
      summary: {
        credit: summary.credit || { total: 0, count: 0 },
        debit: summary.debit || { total: 0, count: 0 },
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to calculate account balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /transactions - Create new transaction
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { accountId, type, amount, comment, enteredBy, transactionDate } = req.body;

    // Validate required fields
    if (!accountId || !type || !amount || !comment || !enteredBy || !transactionDate) {
      return res.status(400).json({
        error: 'Validation error',
        message:
          'accountId, type, amount, comment, enteredBy, and transactionDate are required fields',
      });
    }

    // Verify account exists
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${accountId} does not exist`,
      });
    }

    // Check if account is locked
    if (account.isLocked) {
      return res.status(400).json({
        error: 'Account locked',
        message: 'Cannot create transactions for locked accounts',
      });
    }

    // Validate transaction type
    if (!Object.values(TransactionType).includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        message: `Transaction type must be either '${TransactionType.CREDIT}' or '${TransactionType.DEBIT}'`,
      });
    }

    // Create new transaction
    const transaction = new Transaction({
      accountId,
      type,
      amount: Number(amount),
      comment,
      enteredBy,
      transactionDate,
    });

    const savedTransaction = await transaction.save();

    // Populate account details for response
    await savedTransaction.populate('accountId', 'name accountHolder');

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction: savedTransaction,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create transaction',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PUT /transactions/:id - Update transaction
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { type, amount, comment, enteredBy, transactionDate } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { type, amount, comment, enteredBy, transactionDate },
      { new: true, runValidators: true }
    ).populate('accountId', 'name accountHolder');

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: `Transaction with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to update transaction',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /transactions/:id - Delete transaction
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id).populate(
      'accountId',
      'name accountHolder'
    );

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: `Transaction with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({
      message: 'Transaction deleted successfully',
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete transaction',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
