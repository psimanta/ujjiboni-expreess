"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getAccountBalance = exports.getTransactionsByAccount = exports.getTransactionById = exports.getAllTransactions = void 0;
const models_1 = require("../models");
const mongoose_1 = require("mongoose");
const getAllTransactions = async (req, res) => {
    try {
        const { accountId, type, enteredBy, page = 1, limit = 10 } = req.query;
        const query = {};
        if (accountId) {
            query.accountId = accountId;
        }
        if (type && Object.values(models_1.TransactionType).includes(type)) {
            query.type = type;
        }
        if (enteredBy) {
            query.enteredBy = new RegExp(enteredBy, 'i');
        }
        const skip = (Number(page) - 1) * Number(limit);
        const transactions = await models_1.Transaction.find(query)
            .populate('accountId', 'name accountHolder')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await models_1.Transaction.countDocuments(query);
        return res.json({
            transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to fetch transactions',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAllTransactions = getAllTransactions;
const getTransactionById = async (req, res) => {
    try {
        const transaction = await models_1.Transaction.findById(req.params.id).populate('accountId');
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: `Transaction with ID ${req.params.id} does not exist`,
            });
        }
        return res.json({ transaction });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to fetch transaction',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getTransactionById = getTransactionById;
const getTransactionsByAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { type, page = 1, limit = 10 } = req.query;
        const accountExists = await models_1.Account.findById(accountId)
            .populate('accountHolder', 'fullName email')
            .populate('createdBy', 'fullName email');
        if (!accountExists) {
            return res.status(404).json({
                error: 'Account not found',
                message: `Account with ID ${accountId} does not exist`,
            });
        }
        const query = { accountId };
        if (type && Object.values(models_1.TransactionType).includes(type)) {
            query.type = type;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const transactions = await models_1.Transaction.find(query)
            .sort({ transactionDate: -1 })
            .populate('enteredBy', 'fullName email')
            .skip(skip)
            .limit(Number(limit));
        const total = await models_1.Transaction.countDocuments(query);
        return res.json({
            success: true,
            message: 'Transactions fetched successfully',
            account: accountExists,
            transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to fetch account transactions',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getTransactionsByAccount = getTransactionsByAccount;
const getAccountBalance = async (req, res) => {
    try {
        const { accountId } = req.params;
        const account = await models_1.Account.findById(accountId);
        if (!account) {
            return res.status(404).json({
                error: 'Account not found',
                message: `Account with ID ${accountId} does not exist`,
            });
        }
        const balanceData = await models_1.Transaction.getAccountBalance(new mongoose_1.Types.ObjectId(accountId));
        const summaryData = await models_1.Transaction.getAccountSummary(new mongoose_1.Types.ObjectId(accountId));
        const balance = balanceData.length > 0
            ? balanceData[0]
            : {
                balance: 0,
                totalTransactions: 0,
                lastTransaction: null,
            };
        const summary = summaryData.reduce((acc, item) => {
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
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to calculate account balance',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAccountBalance = getAccountBalance;
const createTransaction = async (req, res) => {
    try {
        const { accountId, type, amount, comment, transactionDate } = req.body;
        const enteredBy = req.user?._id?.toString();
        if (!accountId || !type || !amount || !comment || !enteredBy || !transactionDate) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'accountId, type, amount, comment,  and transactionDate are required fields',
            });
        }
        const account = await models_1.Account.findById(accountId);
        if (!account) {
            return res.status(404).json({
                error: 'Account not found',
                message: `Account with ID ${accountId} does not exist`,
            });
        }
        if (account.isLocked) {
            return res.status(400).json({
                error: 'Account locked',
                message: 'Cannot create transactions for locked accounts',
            });
        }
        if (!Object.values(models_1.TransactionType).includes(type)) {
            return res.status(400).json({
                error: 'Invalid transaction type',
                message: `Transaction type must be either '${models_1.TransactionType.CREDIT}' or '${models_1.TransactionType.DEBIT}'`,
            });
        }
        const transaction = new models_1.Transaction({
            accountId,
            type,
            amount: Number(amount),
            comment,
            enteredBy,
            transactionDate,
        });
        await account.updateBalance(type === models_1.TransactionType.DEBIT ? -Number(amount) : Number(amount));
        const savedTransaction = await transaction.save();
        await savedTransaction.populate('accountId', 'name accountHolder');
        return res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction: savedTransaction,
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
            error: 'Failed to create transaction',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createTransaction = createTransaction;
const updateTransaction = async (req, res) => {
    try {
        const { type, amount, comment, enteredBy, transactionDate } = req.body;
        const transaction = await models_1.Transaction.findByIdAndUpdate(req.params.id, { type, amount, comment, enteredBy, transactionDate }, { new: true, runValidators: true }).populate('accountId', 'name accountHolder');
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
    }
    catch (error) {
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
exports.updateTransaction = updateTransaction;
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await models_1.Transaction.findByIdAndDelete(req.params.id).populate('accountId', 'name accountHolder');
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
    }
    catch (error) {
        return res.status(500).json({
            error: 'Failed to delete transaction',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.deleteTransaction = deleteTransaction;
//# sourceMappingURL=transaction.controller.js.map