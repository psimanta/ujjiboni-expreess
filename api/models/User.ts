import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  password?: string;
  role: UserRole;
  lastLogin?: Date;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  markLogin(): Promise<void>;
  setPassword(newPassword: string): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: 'Please enter a valid email address',
      },
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
      required: true,
    },
    lastLogin: {
      type: Date,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for faster email lookups
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to mark login
userSchema.methods.markLogin = async function (): Promise<void> {
  this.lastLogin = new Date();
  this.isFirstLogin = false;
  await this.save();
};

// Instance method to set password
userSchema.methods.setPassword = async function (newPassword: string): Promise<void> {
  this.password = newPassword;
  this.isFirstLogin = false;
  await this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByRole = function (role: UserRole) {
  return this.find({ role });
};

userSchema.statics.getAdmins = function () {
  return this.find({ role: UserRole.ADMIN });
};

userSchema.statics.getMembers = function () {
  return this.find({ role: UserRole.MEMBER });
};

const User = mongoose.model<IUser>('User', userSchema);

export { User };
export default User;
