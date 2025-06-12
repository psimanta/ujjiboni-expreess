import { Schema, model, Document, Types, Model } from 'mongoose';

// Transaction types enum
export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

// Define interface for the Transaction document
export interface ITransaction extends Document {
  accountId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  comment: string;
  enteredBy: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  getFormattedAmount(): string;
}

// Define interface for Transaction static methods
export interface ITransactionModel extends Model<ITransaction> {
  findByAccount(accountId: Types.ObjectId): Promise<ITransaction[]>;
  findByType(type: TransactionType): Promise<ITransaction[]>;
  getAccountBalance(accountId: Types.ObjectId): Promise<any[]>;
  getAccountSummary(accountId: Types.ObjectId): Promise<any[]>;
}

// Define the Transaction schema
const transactionSchema = new Schema<ITransaction>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
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
        validator: function (value: number) {
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
      type: String,
      required: [true, 'Transaction entered by is required'],
      trim: true,
      maxlength: [100, 'Entered by cannot exceed 100 characters'],
      index: true,
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'], // e.g. 2024-01-15T14:30:00.000Z
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add indexes for better query performance
transactionSchema.index({ accountId: 1, createdAt: -1 }); // For account transaction history
transactionSchema.index({ type: 1, createdAt: -1 }); // For filtering by transaction type
transactionSchema.index({ accountId: 1, type: 1 }); // Compound index for account + type queries
transactionSchema.index({ enteredBy: 1, createdAt: -1 }); // For filtering by who entered the transaction

// No pre-save middleware needed - using MongoDB's default _id

// Static methods
transactionSchema.statics.findByAccount = function (accountId: Types.ObjectId) {
  return this.find({ accountId }).sort({ createdAt: -1 }).populate('accountId');
};

transactionSchema.statics.findByType = function (type: TransactionType) {
  return this.find({ type }).sort({ createdAt: -1 }).populate('accountId');
};

transactionSchema.statics.getAccountBalance = function (accountId: Types.ObjectId) {
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

transactionSchema.statics.getAccountSummary = function (accountId: Types.ObjectId) {
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

// Instance methods
transactionSchema.methods.getFormattedAmount = function (): string {
  const prefix = this.type === TransactionType.CREDIT ? '+' : '-';
  return `${prefix}$${this.amount.toFixed(2)}`;
};

// Create and export the model
export const Transaction = model<ITransaction, ITransactionModel>('Transaction', transactionSchema);
