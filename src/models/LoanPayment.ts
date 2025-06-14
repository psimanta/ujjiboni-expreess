import mongoose, { Document, Schema } from 'mongoose';

export interface ILoanPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  paymentDate: Date;
  amount: number; // Only principal payments in this model
  outstandingBalanceAfter: number;
  enteredBy: mongoose.Types.ObjectId; // Staff who entered payment
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanPaymentModel extends mongoose.Model<ILoanPayment> {
  findByLoan(loanId: string): mongoose.Query<ILoanPayment[], ILoanPayment>;
  findByMember(memberId: string): mongoose.Query<ILoanPayment[], ILoanPayment>;
  getPaymentSummary(loanId?: string, memberId?: string): Promise<any>;
}

const loanPaymentSchema = new Schema<ILoanPayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        // ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better performance
loanPaymentSchema.index({ loanId: 1, paymentDate: 1 });

// Static method to find payments by loan
loanPaymentSchema.statics.findByLoan = function (loanId: string) {
  return this.find({ loanId })
    .populate('loanId', 'loanNumber principalAmount interestRate')
    .populate('enteredBy', 'fullName email')
    .sort({ paymentDate: -1 });
};

// Static method to find payments by member
loanPaymentSchema.statics.findByMember = function (memberId: string) {
  return this.find({ enteredBy: memberId })
    .populate('loanId', 'loanNumber principalAmount interestRate')
    .populate('enteredBy', 'fullName email')
    .sort({ paymentDate: -1 });
};

// Static method to get payment summary
loanPaymentSchema.statics.getPaymentSummary = async function (loanId?: string) {
  const matchStage: any = {};

  if (loanId) {
    matchStage.loanId = new mongoose.Types.ObjectId(loanId);
  }

  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalPrincipalPaid: { $sum: '$principalAmount' },
        lastPaymentDate: { $max: '$paymentDate' },
        firstPaymentDate: { $min: '$paymentDate' },
        averagePaymentAmount: { $avg: '$principalAmount' },
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

const LoanPayment = mongoose.model<ILoanPayment, ILoanPaymentModel>(
  'LoanPayment',
  loanPaymentSchema
);

export { LoanPayment };
export default LoanPayment;
