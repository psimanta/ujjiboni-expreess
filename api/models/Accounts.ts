import { Schema, model, Document, Types, Model } from 'mongoose';

export enum AccountType {
  CASH = 'cash',
  SAVINGS = 'savings',
  FDR = 'fdr',
  DPS = 'dps',
  SHANCHAYPATRA = 'shanchaypatra',
  OTHER = 'other',
}

// Define interface for the User document (financial account)
export interface IAccount extends Document {
  name: string;
  type: AccountType;
  accountHolder: Types.ObjectId;
  isLocked: boolean;
  balance: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  lock(): Promise<IAccount>;
  unlock(): Promise<IAccount>;
  updateBalance(amount: number): Promise<IAccount>;
}

export interface IAccountModel extends Model<IAccount> {
  findAccountsWithBalance(matchStage: Record<string, string>): Promise<IAccount[]>;
}

// Define the User schema
const accountSchema = new Schema<IAccount>(
  {
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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: (_, ret) => {
        // ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        // ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add instance methods
accountSchema.methods.lock = function (): Promise<IAccount> {
  this.isLocked = true;
  return this.save();
};

accountSchema.methods.updateBalance = function (amount: number) {
  this.balance += amount;
  return this.save();
};

accountSchema.methods.unlock = function (): Promise<IAccount> {
  this.isLocked = false;
  return this.save();
};

// Add static methods
accountSchema.statics.findByAccountHolder = function (accountHolder: string) {
  return this.find({ accountHolder: new RegExp(accountHolder, 'i') });
};

accountSchema.statics.findAccountsWithBalance = function (matchStage) {
  return this.aggregate([
    // Match accounts based on filters
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

    // Lookup transactions for each account
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'accountId',
        as: 'transactions',
      },
    },

    // Calculate balance and transaction stats
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

    // Lookup account holder details
    {
      $lookup: {
        from: 'users',
        localField: 'accountHolder',
        foreignField: '_id',
        as: 'accountHolder',
        pipeline: [{ $project: { fullName: 1 } }],
      },
    },

    // Unwind accountHolder array to object
    {
      $unwind: {
        path: '$accountHolder',
        preserveNullAndEmptyArrays: true,
      },
    },

    // Remove transactions array from output and format response
    {
      $project: {
        transactions: 0,
        __v: 0,
      },
    },

    // Sort by creation date (newest first)
    { $sort: { createdAt: -1 } },
  ]);
};

accountSchema.statics.findUnlocked = function () {
  return this.find({ isLocked: false });
};

accountSchema.statics.findLocked = function () {
  return this.find({ isLocked: true });
};

// Create and export the model
export const Account = model<IAccount, IAccountModel>('Account', accountSchema);
