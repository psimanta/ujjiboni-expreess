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
exports.LoanPayment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const loanPaymentSchema = new mongoose_1.Schema({
    loanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true,
        index: true,
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Amount must be positive'],
    },
    outstandingBalanceAfter: {
        type: Number,
        required: true,
        min: [0, 'Outstanding balance must be non-negative'],
    },
    enteredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (_, ret) {
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
loanPaymentSchema.index({ loanId: 1, paymentDate: 1 });
loanPaymentSchema.statics.findByLoan = function (loanId) {
    return this.find({ loanId })
        .populate('loanId', 'loanNumber principalAmount interestRate')
        .populate('enteredBy', 'fullName email')
        .sort({ paymentDate: -1 });
};
loanPaymentSchema.statics.findByMember = function (memberId) {
    return this.find({ enteredBy: memberId })
        .populate('loanId', 'loanNumber principalAmount interestRate')
        .populate('enteredBy', 'fullName email')
        .sort({ paymentDate: -1 });
};
loanPaymentSchema.statics.getPaymentSummary = async function (loanId) {
    const query = {};
    if (loanId) {
        query.loanId = new mongoose_1.default.Types.ObjectId(loanId);
    }
    const summary = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalPrincipalPaid: { $sum: '$amount' },
                lastPaymentDate: { $max: '$paymentDate' },
                firstPaymentDate: { $min: '$paymentDate' },
                averagePaymentAmount: { $avg: '$amount' },
            },
        },
    ]);
    if (summary.length === 0) {
        return {
            totalPayments: 0,
            totalPrincipalPaid: 0,
            lastPaymentDate: null,
            firstPaymentDate: null,
            averagePaymentAmount: 0,
        };
    }
    return summary[0];
};
const LoanPayment = mongoose_1.default.model('LoanPayment', loanPaymentSchema);
exports.LoanPayment = LoanPayment;
exports.default = LoanPayment;
//# sourceMappingURL=LoanPayment.js.map