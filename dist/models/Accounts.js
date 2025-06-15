"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = exports.AccountType = void 0;
const mongoose_1 = require("mongoose");
var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "cash";
    AccountType["SAVINGS"] = "savings";
    AccountType["FDR"] = "fdr";
    AccountType["DPS"] = "dps";
    AccountType["SHANCHAYPATRA"] = "shanchaypatra";
    AccountType["OTHER"] = "other";
})(AccountType || (exports.AccountType = AccountType = {}));
const accountSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true,
        maxlength: [100, 'Account name cannot exceed 100 characters'],
    },
    type: {
        type: String,
        enum: Object.values(AccountType),
        required: [true, 'Account type is required'],
    },
    accountHolder: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Account holder is required'],
    },
    balance: {
        type: Number,
        default: 0,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required'],
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
accountSchema.methods.lock = function () {
    this.isLocked = true;
    return this.save();
};
accountSchema.methods.updateBalance = function (amount) {
    this.balance += amount;
    return this.save();
};
accountSchema.methods.unlock = function () {
    this.isLocked = false;
    return this.save();
};
accountSchema.statics.findByAccountHolder = function (accountHolder) {
    return this.find({ accountHolder: new RegExp(accountHolder, 'i') });
};
accountSchema.statics.findAccountsWithBalance = function (matchStage) {
    return this.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
            $lookup: {
                from: 'transactions',
                localField: '_id',
                foreignField: 'accountId',
                as: 'transactions',
            },
        },
        {
            $addFields: {
                balance: {
                    $reduce: {
                        input: '$transactions',
                        initialValue: 0,
                        in: {
                            $add: [
                                '$$value',
                                {
                                    $cond: [
                                        { $eq: ['$$this.type', 'credit'] },
                                        '$$this.amount',
                                        { $multiply: ['$$this.amount', -1] },
                                    ],
                                },
                            ],
                        },
                    },
                },
                totalTransactions: { $size: '$transactions' },
                lastTransaction: {
                    $max: '$transactions.transactionDate',
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'accountHolder',
                foreignField: '_id',
                as: 'accountHolder',
                pipeline: [{ $project: { fullName: 1 } }],
            },
        },
        {
            $unwind: {
                path: '$accountHolder',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                transactions: 0,
                __v: 0,
            },
        },
        { $sort: { createdAt: -1 } },
    ]);
};
accountSchema.statics.findUnlocked = function () {
    return this.find({ isLocked: false });
};
accountSchema.statics.findLocked = function () {
    return this.find({ isLocked: true });
};
exports.Account = (0, mongoose_1.model)('Account', accountSchema);
//# sourceMappingURL=Accounts.js.map