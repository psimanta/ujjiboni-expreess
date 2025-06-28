import mongoose, { Document } from 'mongoose';
export declare enum OTPStatus {
    PENDING = "PENDING",
    USED = "USED",
    EXPIRED = "EXPIRED"
}
export declare enum OTPPurpose {
    PASSWORD_SETUP = "PASSWORD_SETUP",
    PASSWORD_RESET = "PASSWORD_RESET",
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
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
declare const OTP: IOTPModel;
export { OTP };
export default OTP;
//# sourceMappingURL=OTP.d.ts.map