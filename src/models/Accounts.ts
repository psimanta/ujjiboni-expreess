import { Schema, model, Document, Types } from 'mongoose';

// Define interface for the User document (financial account)
export interface IAccount extends Document {
  name: string;
  accountHolder: Types.ObjectId;
  isLocked: boolean;

  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  lock(): Promise<IAccount>;
  unlock(): Promise<IAccount>;
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
    accountHolder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Account holder is required'],
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
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

// Add instance methods
accountSchema.methods.lock = function (): Promise<IAccount> {
  this.isLocked = true;
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

accountSchema.statics.findUnlocked = function () {
  return this.find({ isLocked: false });
};

accountSchema.statics.findLocked = function () {
  return this.find({ isLocked: true });
};

// Create and export the model
export const Account = model<IAccount>('Account', accountSchema);
