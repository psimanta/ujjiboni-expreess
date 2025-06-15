"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.TransactionType = void 0;
const mongoose_1 = require("mongoose");
var TransactionType;
(function (TransactionType) {
    TransactionType["DEBIT"] = "debit";
    TransactionType["CREDIT"] = "credit";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
const transactionSchema = new mongoose_1.Schema({
    accountId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account ID is required'],
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: [true, 'Transaction type is required'],
        index: true,
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        validate: {
            validator: function (value) {
                return Number.isFinite(value) && value > 0;
            },
            message: 'Amount must be a valid positive number',
        },
    },
    comment: {
        type: String,
        required: [true, 'Transaction comment is required'],
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    enteredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Transaction entered by is required'],
    },
    transactionDate: {
        type: Date,
        required: [true, 'Transaction date is required'],
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: (_, ret) => {
            delete ret.__v;
            return ret;
        },
    },
});
transactionSchema.index({ accountId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ accountId: 1, type: 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ accountId: 1, transactionDate: -1 });
transactionSchema.statics.findByAccount = function (accountId) {
    return this.find({ accountId }).sort({ createdAt: -1 }).populate('accountId');
};
transactionSchema.statics.findByType = function (type) {
    return this.find({ type }).sort({ createdAt: -1 }).populate('accountId');
};
transactionSchema.statics.getAccountBalance = function (accountId) {
    return this.aggregate([
        { $match: { accountId } },
        {
            $group: {
                _id: '$accountId',
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', TransactionType.CREDIT] },
                            '$amount',
                            { $multiply: ['$amount', -1] },
                        ],
                    },
                },
                totalTransactions: { $sum: 1 },
                lastTransaction: { $max: '$transactionDate' },
            },
        },
    ]);
};
transactionSchema.statics.getAccountSummary = function (accountId) {
    return this.aggregate([
        { $match: { accountId } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
    ]);
};
transactionSchema.methods.getFormattedAmount = function () {
    const prefix = this.type === TransactionType.CREDIT ? '+' : '-';
    return `${prefix}$${this.amount.toFixed(2)}`;
};
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
//# sourceMappingURL=Transaction.js.map