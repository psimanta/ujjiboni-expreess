import { Request, Response } from 'express';
import { Account, type IAccount } from '../models';

// GET /accounts - Get all accounts (financial accounts)
export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const { isLocked, accountHolder } = req.query;

    // Build query object
    const query: any = {};
    if (typeof isLocked !== 'undefined') {
      query.isLocked = isLocked === 'true';
    }
    if (accountHolder) {
      query.accountHolder = new RegExp(accountHolder as string, 'i');
    }

    // Execute query
    const accounts = await Account.find(query)
      .sort({ createdAt: -1 })
      .populate('accountHolder', 'fullName');

    return res.json({ accounts });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch accounts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /accounts/:id - Get account by ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({ account });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /accounts - Create new account
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, accountHolder, isLocked = false } = req.body;

    // Validate required fields
    if (!name || !accountHolder) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name and accountHolder are required fields',
      });
    }

    // Create new account
    const account = new Account({
      name,
      accountHolder,
      isLocked,
    });

    const savedAccount = await account.save();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      account: savedAccount,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PUT /accounts/:id - Update account
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { name, accountHolder, isLocked } = req.body;

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { name, accountHolder, isLocked },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({
      message: 'Account updated successfully',
      account,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to update account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PATCH /accounts/:id/lock - Lock account
export const lockAccount = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${req.params.id} does not exist`,
      });
    }

    await account.lock();

    return res.json({
      message: 'Account locked successfully',
      account,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to lock account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PATCH /accounts/:id/unlock - Unlock account
export const unlockAccount = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${req.params.id} does not exist`,
      });
    }

    await account.unlock();

    return res.json({
      message: 'Account unlocked successfully',
      account,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to unlock account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /accounts/:id - Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: `Account with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({
      message: 'Account deleted successfully',
      account,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
