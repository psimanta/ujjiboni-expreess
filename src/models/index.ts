// Export all models from this directory
export { Account, type IAccount } from './Accounts';
export {
  Transaction,
  TransactionType,
  type ITransaction,
  type ITransactionModel,
} from './Transaction';

// This file makes it easy to import models like:
// import { Account, Transaction } from '../models';
// instead of:
// import { Account } from '../models/Accounts';
// import { Transaction } from '../models/Transaction';
