import mongoose, { Document, Schema } from 'mongoose';

export enum OTPStatus {
  PENDING = 'PENDING',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export enum OTPPurpose {
  PASSWORD_SETUP = 'PASSWORD_SETUP',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  otpCode: string;
  purpose: OTPPurpose;
  status: OTPStatus;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date;

  // Instance methods
  isValid(): boolean;
  isExpired(): boolean;
  canAttempt(): boolean;
  markAsUsed(): Promise<void>;
  incrementAttempts(): Promise<void>;
}

export interface IOTPModel extends mongoose.Model<IOTP> {
  generateOTP(userId: string, purpose: OTPPurpose, expiryMinutes?: number): Promise<IOTP>;
  verifyOTP(userId: string, otpCode: string, purpose: OTPPurpose): Promise<IOTP | null>;
  cleanupExpiredOTPs(): Promise<number>;
  findValidOTP(userId: string, purpose: OTPPurpose): Promise<IOTP | null>;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    otpCode: {
      type: String,
      required: true,
      length: 6, // 6-digit OTP
    },
    purpose: {
      type: String,
      enum: Object.values(OTPPurpose),
      required: true,
      default: OTPPurpose.PASSWORD_SETUP,
    },
    status: {
      type: String,
      enum: Object.values(OTPStatus),
      required: true,
      default: OTPStatus.PENDING,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index for auto-cleanup
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
      max: 10,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        delete ret.__v;
        delete ret.otpCode; // Never expose OTP code in JSON response
        return ret;
      },
    },
  }
);

// Compound indexes for better performance
otpSchema.index({ userId: 1, purpose: 1, status: 1 });
otpSchema.index({ expiresAt: 1 });

// Instance method to check if OTP is valid
otpSchema.methods.isValid = function (): boolean {
  return this.status === OTPStatus.PENDING && !this.isExpired() && this.canAttempt();
};

// Instance method to check if OTP is expired
otpSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if can attempt verification
otpSchema.methods.canAttempt = function (): boolean {
  return this.attempts < this.maxAttempts;
};

// Instance method to mark OTP as used
otpSchema.methods.markAsUsed = async function (): Promise<void> {
  this.status = OTPStatus.USED;
  this.usedAt = new Date();
  await this.save();
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = async function (): Promise<void> {
  this.attempts += 1;
  if (this.attempts >= this.maxAttempts) {
    this.status = OTPStatus.EXPIRED;
  }
  await this.save();
};

// Static method to generate OTP
otpSchema.statics.generateOTP = async function (
  userId: string,
  purpose: OTPPurpose,
  expiryMinutes: number = 15
): Promise<IOTP> {
  // Invalidate any existing pending OTPs for this user and purpose
  await this.updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      purpose,
      status: OTPStatus.PENDING,
    },
    {
      status: OTPStatus.EXPIRED,
    }
  );

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Calculate expiry time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  // Create new OTP
  const otp = new this({
    userId: new mongoose.Types.ObjectId(userId),
    otpCode,
    purpose,
    status: OTPStatus.PENDING,
    expiresAt,
    attempts: 0,
    maxAttempts: 3,
  });

  await otp.save();
  return otp;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function (
  userId: string,
  otpCode: string,
  purpose: OTPPurpose
): Promise<IOTP | null> {
  const otp = await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    purpose,
    status: OTPStatus.PENDING,
  });

  if (!otp) {
    return null;
  }

  // Check if OTP is expired
  if (otp.isExpired()) {
    otp.status = OTPStatus.EXPIRED;
    await otp.save();
    return null;
  }

  // Check if max attempts reached
  if (!otp.canAttempt()) {
    otp.status = OTPStatus.EXPIRED;
    await otp.save();
    return null;
  }

  // Verify OTP code
  if (otp.otpCode !== otpCode) {
    await otp.incrementAttempts();
    return null;
  }

  // OTP is valid
  await otp.markAsUsed();
  return otp;
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = async function (
  userId: string,
  purpose: OTPPurpose
): Promise<IOTP | null> {
  const otp = await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    purpose,
    status: OTPStatus.PENDING,
  });

  if (!otp || !otp.isValid()) {
    return null;
  }

  return otp;
};

// Static method to cleanup expired OTPs
otpSchema.statics.cleanupExpiredOTPs = async function (): Promise<number> {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lte: new Date() } },
      { status: { $in: [OTPStatus.USED, OTPStatus.EXPIRED] } },
    ],
  });

  return result.deletedCount;
};

// Pre-save middleware to update status if expired
otpSchema.pre('save', function (next) {
  if (this.isExpired() && this.status === OTPStatus.PENDING) {
    this.status = OTPStatus.EXPIRED;
  }
  next();
});

const OTP = mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);

export { OTP };
export default OTP;
