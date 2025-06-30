import { Request, Response } from 'express';
import { Account, IAccount } from '../models';
import { FilterQuery } from 'mongoose';

const sortOrderMap: Record<string, 1 | -1> = {
  asc: 1,
  desc: -1,
};

// GET /accounts - Get all accounts (financial accounts)
export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const { isLocked, accountHolder, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build match stage for filtering
    const query: FilterQuery<IAccount> = {};
    if (typeof isLocked !== 'undefined') {
      query.isLocked = isLocked === 'true';
    }
    if (accountHolder) {
      query.accountHolder = new RegExp(accountHolder as string, 'i');
    }

    // Get accounts with balance
    const accountsWithBalance = await Account.find(query)
      .populate('accountHolder', 'fullName email')
      .populate('createdBy', 'fullName email')
      .sort({ [sortBy as string]: sortOrderMap[sortOrder as string] });

    // Use aggregation to join accounts with their calculated balance

    return res.json({
      success: true,
      message: 'Accounts fetched successfully',
      accounts: accountsWithBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /accounts/:id - Get account by ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id).populate(
      'accountHolder',
      'fullName email'
    );

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

// POST /accounts - Create new account.
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, accountHolder, isLocked = false, type } = req.body;

    // Validate required fields
    if (!name || !accountHolder) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'name, accountHolder, and createdBy are required fields',
      });
    }

    // Create new account
    const account = new Account({
      name,
      accountHolder,
      isLocked,
      createdBy: req.user?._id?.toString(),
      type,
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
