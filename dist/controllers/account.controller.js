"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.unlockAccount = exports.lockAccount = exports.updateAccount = exports.createAccount = exports.getAccountById = exports.getAllAccounts = void 0;
const models_1 = require("../models");
const getAllAccounts = async (req, res) => {
    try {
        const { isLocked, accountHolder } = req.query;
        const query = {};
        if (typeof isLocked !== 'undefined') {
            query.isLocked = isLocked === 'true';
        }
        if (accountHolder) {
            query.accountHolder = new RegExp(accountHolder, 'i');
        }
        const accounts = await models_1.Account.find(query).sort({ createdAt: -1 });
        return res.json({ accounts });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to fetch accounts',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAllAccounts = getAllAccounts;
const getAccountById = async (req, res) => {
    try {
        const account = await models_1.Account.findById(req.params.id);
        if (!account) {
            return res.status(404).json({
                error: 'Account not found',
                message: `Account with ID ${req.params.id} does not exist`,
            });
        }
        return res.json({ account });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to fetch account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAccountById = getAccountById;
const createAccount = async (req, res) => {
    try {
        const { name, accountHolder, isLocked = false } = req.body;
        if (!name || !accountHolder) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'Name and accountHolder are required fields',
            });
        }
        const account = new models_1.Account({
            name,
            accountHolder,
            isLocked,
        });
        const savedAccount = await account.save();
        return res.status(201).json({
            message: 'Account created successfully',
            account: savedAccount,
        });
    }
    catch (error) {
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
exports.createAccount = createAccount;
const updateAccount = async (req, res) => {
    try {
        const { name, accountHolder, isLocked } = req.body;
        const account = await models_1.Account.findByIdAndUpdate(req.params.id, { name, accountHolder, isLocked }, { new: true, runValidators: true });
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
    }
    catch (error) {
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
exports.updateAccount = updateAccount;
const lockAccount = async (req, res) => {
    try {
        const account = await models_1.Account.findById(req.params.id);
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
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to lock account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.lockAccount = lockAccount;
const unlockAccount = async (req, res) => {
    try {
        const account = await models_1.Account.findById(req.params.id);
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
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to unlock account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.unlockAccount = unlockAccount;
const deleteAccount = async (req, res) => {
    try {
        const account = await models_1.Account.findByIdAndDelete(req.params.id);
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
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to delete account',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=account.controller.js.map