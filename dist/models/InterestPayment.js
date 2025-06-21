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
exports.InterestPayment = exports.PaymentMethod = exports.InterestPaymentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var InterestPaymentStatus;
(function (InterestPaymentStatus) {
    InterestPaymentStatus["PENDING"] = "PENDING";
    InterestPaymentStatus["PAID"] = "PAID";
    InterestPaymentStatus["OVERDUE"] = "OVERDUE";
    InterestPaymentStatus["PARTIAL"] = "PARTIAL";
})(InterestPaymentStatus || (exports.InterestPaymentStatus = InterestPaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["CHEQUE"] = "CHEQUE";
    PaymentMethod["ONLINE"] = "ONLINE";
    PaymentMethod["UPI"] = "UPI";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
const interestPaymentSchema = new mongoose_1.Schema({
    loanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true,
    },
    paymentDate: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^\d{4}-(?:0[1-9]|1[0-2])-01$/.test(value);
            },
            message: 'Payment date must be in YYYY-MM-01 format',
        },
    },
    previousInterestDue: {
        type: Number,
        required: true,
        min: [0, 'Previous interest due must be non-negative'],
    },
    dueAfterInterestPayment: {
        type: Number,
        required: true,
        min: [0, 'Due after interest payment must be non-negative'],
    },
    penaltyAmount: {
        type: Number,
        required: true,
        min: [0, 'Penalty amount must be non-negative'],
        default: 0,
    },
    interestAmount: {
        type: Number,
        required: true,
        min: [0, 'Interest amount must be non-negative'],
    },
    paidAmount: {
        type: Number,
        required: true,
        min: [0, 'Paid amount must be non-negative'],
        default: 0,
    },
    enteredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (_, ret) {
            delete ret.__v;
            return ret;
        },
    },
});
interestPaymentSchema.index({ loanId: 1 });
interestPaymentSchema.statics.findByLoan = function (loanId) {
    return this.find({ loanId })
        .populate('loanId', 'loanNumber principalAmount interestRate')
        .sort({ createdAt: -1 });
};
interestPaymentSchema.statics.getPaymentSummary = async function (loanId) {
    const query = {};
    if (loanId) {
        query.loanId = new mongoose_1.default.Types.ObjectId(loanId);
    }
    const summary = await this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalInterest: { $sum: '$interestAmount' },
                totalPaid: { $sum: '$paidAmount' },
            },
        },
    ]);
    const result = {
        totalPayments: 0,
        totalInterest: 0,
        totalPaidAmount: 0,
    };
    summary.forEach(item => {
        result.totalPayments += item.count;
        result.totalInterest += item.totalInterest;
        result.totalPaidAmount += item.totalPaid;
    });
    return result;
};
interestPaymentSchema.statics.generateMonthlyInterest = async function (loanId) {
    const Loan = mongoose_1.default.model('Loan');
    const loan = await Loan.findById(loanId);
    if (!loan) {
        throw new Error('Loan not found');
    }
    if (loan.status !== 'ACTIVE') {
        throw new Error('Interest can only be generated for active loans');
    }
    const outstandingBalance = await loan.calculateOutstandingBalance();
    if (outstandingBalance <= 0) {
        throw new Error('No outstanding balance for interest calculation');
    }
    const dueAmount = outstandingBalance * loan.monthlyInterestRate;
    const lastInterestPayment = await this.findOne({ loanId }).sort({ dueDate: -1 });
    let dueDate;
    if (lastInterestPayment) {
        dueDate = new Date(lastInterestPayment.dueDate);
        dueDate.setMonth(dueDate.getMonth() + 1);
    }
    else {
        dueDate = new Date(loan.disbursedDate);
        dueDate.setMonth(dueDate.getMonth() + 1);
    }
    const interestPayment = new this({
        loanId,
        dueDate,
        dueAmount,
        paidAmount: 0,
    });
    await interestPayment.save();
    return interestPayment;
};
const InterestPayment = mongoose_1.default.model('InterestPayment', interestPaymentSchema);
exports.InterestPayment = InterestPayment;
exports.default = InterestPayment;
//# sourceMappingURL=InterestPayment.js.map