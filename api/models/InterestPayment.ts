import mongoose, { Document, FilterQuery, Schema } from 'mongoose';

export enum InterestPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
  UPI = 'UPI',
}

export interface IInterestPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  paymentDate?: string;
  penaltyAmount: number;
  previousInterestDue: number;
  dueAfterInterestPayment: number;
  interestAmount: number;
  paidAmount: number;
  enteredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterestPaymentModel extends mongoose.Model<IInterestPayment> {
  findByLoan(loanId: string): mongoose.Query<IInterestPayment[], IInterestPayment>;
  getPaymentSummary(loanId?: string): Promise<{
    totalPayments: number;
    totalInterest: number;
    totalPaidAmount: number;
  }>;
  generateMonthlyInterest(loanId: string): Promise<IInterestPayment>;
}

const interestPaymentSchema = new Schema<IInterestPayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    paymentDate: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        // ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better performance
interestPaymentSchema.index({ loanId: 1 });

// Static method to generate payment numbe

// Static method to find payments by loan
interestPaymentSchema.statics.findByLoan = function (loanId: string) {
  return this.find({ loanId })
    .populate('loanId', 'loanNumber principalAmount interestRate')
    .sort({ createdAt: -1 });
};

// Static method to get payment summary
interestPaymentSchema.statics.getPaymentSummary = async function (loanId?: string) {
  const query: FilterQuery<IInterestPayment> = {};

  if (loanId) {
    query.loanId = new mongoose.Types.ObjectId(loanId);
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

// Static method to generate monthly interest payment
interestPaymentSchema.statics.generateMonthlyInterest = async function (
  loanId: string
): Promise<IInterestPayment> {
  const Loan = mongoose.model('Loan');
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new Error('Loan not found');
  }

  if (loan.status !== 'ACTIVE') {
    throw new Error('Interest can only be generated for active loans');
  }

  // Calculate outstanding balance
  const outstandingBalance = await loan.calculateOutstandingBalance();

  if (outstandingBalance <= 0) {
    throw new Error('No outstanding balance for interest calculation');
  }

  // Calculate due amount
  const dueAmount = outstandingBalance * loan.monthlyInterestRate;

  // Calculate due date (next month from last payment or disbursement date)
  const lastInterestPayment = await this.findOne({ loanId }).sort({ dueDate: -1 });

  let dueDate: Date;
  if (lastInterestPayment) {
    dueDate = new Date(lastInterestPayment.dueDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
  } else {
    dueDate = new Date(loan.disbursedDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  // Create interest payment record
  const interestPayment = new this({
    loanId,
    dueDate,
    dueAmount,
    paidAmount: 0,
  });

  await interestPayment.save();
  return interestPayment;
};

const InterestPayment = mongoose.model<IInterestPayment, IInterestPaymentModel>(
  'InterestPayment',
  interestPaymentSchema
);

export { InterestPayment };
export default InterestPayment;
