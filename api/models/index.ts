// Export all models from this directory
export { Account, type IAccount } from './Accounts';
export {
  Transaction,
  TransactionType,
  type ITransaction,
  type ITransactionModel,
} from './Transaction';
export { User, UserRole, type IUser } from './User';
export { Loan, LoanStatus, LoanType, type ILoan } from './Loan';
export { LoanPayment, type ILoanPayment } from './LoanPayment';
export { InterestPayment, InterestPaymentStatus, type IInterestPayment } from './InterestPayment';
export { OTP, OTPStatus, OTPPurpose, type IOTP } from './OTP';

// This file makes it easy to import models like:
// import { Account, Transaction, OTP } from '../models';
// instead of:
// import { Account } from '../models/Accounts';
// import { Transaction } from '../models/Transaction';
// import { OTP } from '../models/OTP';
