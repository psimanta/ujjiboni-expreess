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
exports.Loan = exports.LoanType = exports.LoanStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["ACTIVE"] = "ACTIVE";
    LoanStatus["COMPLETED"] = "COMPLETED";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
var LoanType;
(function (LoanType) {
    LoanType["PERSONAL"] = "PERSONAL";
    LoanType["BUSINESS"] = "BUSINESS";
    LoanType["EMERGENCY"] = "EMERGENCY";
    LoanType["EDUCATION"] = "EDUCATION";
})(LoanType || (exports.LoanType = LoanType = {}));
const loanSchema = new mongoose_1.Schema({
    memberId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    loanType: {
        type: String,
        enum: Object.values(LoanType),
        required: true,
        default: LoanType.PERSONAL,
    },
    loanNumber: {
        type: String,
        required: true,
    },
    principalAmount: {
        type: Number,
        required: true,
        min: [0, 'Principal amount must be positive'],
    },
    monthlyInterestRate: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(LoanStatus),
        default: LoanStatus.ACTIVE,
        required: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
loanSchema.index({ memberId: 1, status: 1 });
loanSchema.index({ status: 1 });
loanSchema.methods.calculateOutstandingBalance = async function () {
    const LoanPayment = mongoose_1.default.model('LoanPayment');
    const payments = await LoanPayment.aggregate([
        { $match: { loanId: this._id } },
        {
            $group: {
                _id: null,
                totalPrincipalPaid: { $sum: '$principalAmount' },
            },
        },
    ]);
    const totalPrincipalPaid = payments.length > 0 ? payments[0].totalPrincipalPaid : 0;
    return this.principalAmount - totalPrincipalPaid;
};
loanSchema.methods.getPaymentHistory = async function () {
    const LoanPayment = mongoose_1.default.model('LoanPayment');
    return await LoanPayment.find({ loanId: this._id })
        .populate('enteredBy', 'fullName email')
        .sort({ paymentDate: -1 });
};
loanSchema.statics.generateLoanNumber = async function () {
    const currentYear = new Date().getFullYear();
    const prefix = `LN${currentYear}`;
    const lastLoan = await this.findOne({
        loanNumber: { $regex: `^${prefix}` },
    }).sort({ loanNumber: -1 });
    let sequence = 1;
    if (lastLoan) {
        const lastSequence = parseInt(lastLoan.loanNumber.substring(prefix.length));
        sequence = lastSequence + 1;
    }
    return `${prefix}${sequence.toString().padStart(4, '0')}`;
};
loanSchema.statics.findByMember = function (memberId) {
    return this.find({ memberId })
        .populate('memberId', 'fullName email')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 });
};
loanSchema.statics.findActiveLoans = function () {
    return this.find({ status: LoanStatus.ACTIVE })
        .populate('memberId', 'fullName email')
        .sort({ createdAt: -1 });
};
loanSchema.statics.getLoanSummary = async function (memberId) {
    const matchStage = memberId ? { memberId: new mongoose_1.default.Types.ObjectId(memberId) } : {};
    const summary = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalPrincipal: { $sum: '$principalAmount' },
            },
        },
    ]);
    const result = {
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        defaultedLoans: 0,
        suspendedLoans: 0,
        totalPrincipalAmount: 0,
    };
    summary.forEach(item => {
        result.totalLoans += item.count;
        result.totalPrincipalAmount += item.totalPrincipal;
        switch (item._id) {
            case LoanStatus.ACTIVE:
                result.activeLoans = item.count;
                break;
            case LoanStatus.COMPLETED:
                result.completedLoans = item.count;
                break;
        }
    });
    return result;
};
const Loan = mongoose_1.default.model('Loan', loanSchema);
exports.Loan = Loan;
exports.default = Loan;
//# sourceMappingURL=Loan.js.map