"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP = exports.OTPPurpose = exports.OTPStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var OTPStatus;
(function (OTPStatus) {
    OTPStatus["PENDING"] = "PENDING";
    OTPStatus["USED"] = "USED";
    OTPStatus["EXPIRED"] = "EXPIRED";
})(OTPStatus || (exports.OTPStatus = OTPStatus = {}));
var OTPPurpose;
(function (OTPPurpose) {
    OTPPurpose["PASSWORD_SETUP"] = "PASSWORD_SETUP";
    OTPPurpose["PASSWORD_RESET"] = "PASSWORD_RESET";
    OTPPurpose["EMAIL_VERIFICATION"] = "EMAIL_VERIFICATION";
})(OTPPurpose || (exports.OTPPurpose = OTPPurpose = {}));
const otpSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    otpCode: {
        type: String,
        required: true,
        length: 6,
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
        index: { expireAfterSeconds: 0 },
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (_, ret) {
            delete ret.__v;
            delete ret.otpCode;
            return ret;
        },
    },
});
otpSchema.index({ userId: 1, purpose: 1, status: 1 });
otpSchema.index({ expiresAt: 1 });
otpSchema.methods.isValid = function () {
    return this.status === OTPStatus.PENDING && !this.isExpired() && this.canAttempt();
};
otpSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};
otpSchema.methods.canAttempt = function () {
    return this.attempts < this.maxAttempts;
};
otpSchema.methods.markAsUsed = async function () {
    this.status = OTPStatus.USED;
    this.usedAt = new Date();
    await this.save();
};
otpSchema.methods.incrementAttempts = async function () {
    this.attempts += 1;
    if (this.attempts >= this.maxAttempts) {
        this.status = OTPStatus.EXPIRED;
    }
    await this.save();
};
otpSchema.statics.generateOTP = async function (userId, purpose, expiryMinutes = 15) {
    await this.updateMany({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        purpose,
        status: OTPStatus.PENDING,
    }, {
        status: OTPStatus.EXPIRED,
    });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    const otp = new this({
        userId: new mongoose_1.default.Types.ObjectId(userId),
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
otpSchema.statics.verifyOTP = async function (userId, otpCode, purpose) {
    const otp = await this.findOne({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        purpose,
        status: OTPStatus.PENDING,
    });
    if (!otp) {
        return null;
    }
    if (otp.isExpired()) {
        otp.status = OTPStatus.EXPIRED;
        await otp.save();
        return null;
    }
    if (!otp.canAttempt()) {
        otp.status = OTPStatus.EXPIRED;
        await otp.save();
        return null;
    }
    if (otp.otpCode !== otpCode) {
        await otp.incrementAttempts();
        return null;
    }
    await otp.markAsUsed();
    return otp;
};
otpSchema.statics.findValidOTP = async function (userId, purpose) {
    const otp = await this.findOne({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        purpose,
        status: OTPStatus.PENDING,
    });
    if (!otp || !otp.isValid()) {
        return null;
    }
    return otp;
};
otpSchema.statics.cleanupExpiredOTPs = async function () {
    const result = await this.deleteMany({
        $or: [
            { expiresAt: { $lte: new Date() } },
            { status: { $in: [OTPStatus.USED, OTPStatus.EXPIRED] } },
        ],
    });
    return result.deletedCount;
};
otpSchema.pre('save', function (next) {
    if (this.isExpired() && this.status === OTPStatus.PENDING) {
        this.status = OTPStatus.EXPIRED;
    }
    next();
});
const OTP = mongoose_1.default.model('OTP', otpSchema);
exports.OTP = OTP;
exports.default = OTP;
//# sourceMappingURL=OTP.js.map