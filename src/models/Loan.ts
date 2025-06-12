import mongoose, { Document, Schema } from 'mongoose';

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum LoanType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  EMERGENCY = 'EMERGENCY',
  EDUCATION = 'EDUCATION',
}

export interface ILoan extends Document {
  memberId: mongoose.Types.ObjectId;
  loanType: LoanType;
  loanNumber: string;
  principalAmount: number;
  monthlyInterestRate: number; // Calculated monthly interest rate
  status: LoanStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateOutstandingBalance(): Promise<number>;
  getPaymentHistory(): Promise<any[]>;
}

export interface ILoanModel extends mongoose.Model<ILoan> {
  generateLoanNumber(): Promise<string>;
  findByMember(memberId: string): mongoose.Query<ILoan[], ILoan>;
  findActiveLoans(): mongoose.Query<ILoan[], ILoan>;
  findOverdueLoans(): mongoose.Query<ILoan[], ILoan>;
  getLoanSummary(memberId?: string): Promise<any>;
}

const loanSchema = new Schema<ILoan>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better performance
loanSchema.index({ memberId: 1, status: 1 });
loanSchema.index({ status: 1 });

// Instance method to calculate outstanding balance
loanSchema.methods.calculateOutstandingBalance = async function (): Promise<number> {
  const LoanPayment = mongoose.model('LoanPayment');

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

// Instance method to get payment history
loanSchema.methods.getPaymentHistory = async function (): Promise<any[]> {
  const LoanPayment = mongoose.model('LoanPayment');

  return await LoanPayment.find({ loanId: this._id })
    .populate('enteredBy', 'fullName email')
    .sort({ paymentDate: -1 });
};

// Static method to generate loan number
loanSchema.statics.generateLoanNumber = async function (): Promise<string> {
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

// Static method to find loans by member
loanSchema.statics.findByMember = function (memberId: string) {
  return this.find({ memberId })
    .populate('memberId', 'fullName email')
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 });
};

// Static method to find active loans
loanSchema.statics.findActiveLoans = function () {
  return this.find({ status: LoanStatus.ACTIVE })
    .populate('memberId', 'fullName email')
    .sort({ createdAt: -1 });
};

// Static method to get loan summary
loanSchema.statics.getLoanSummary = async function (memberId?: string) {
  const matchStage = memberId ? { memberId: new mongoose.Types.ObjectId(memberId) } : {};

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

const Loan = mongoose.model<ILoan, ILoanModel>('Loan', loanSchema);

export { Loan };
export default Loan;
