import { Document, Types, Model } from 'mongoose';
export declare enum TransactionType {
    DEBIT = "debit",
    CREDIT = "credit"
}
export interface ITransaction extends Document {
    accountId: Types.ObjectId;
    type: TransactionType;
    amount: number;
    comment: string;
    enteredBy: Types.ObjectId;
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
    getFormattedAmount(): string;
}
export interface ITransactionModel extends Model<ITransaction> {
    findByAccount(accountId: Types.ObjectId): Promise<ITransaction[]>;
    findByType(type: TransactionType): Promise<ITransaction[]>;
    getAccountBalance(accountId: Types.ObjectId): Promise<{
        _id: Types.ObjectId;
        balance: number;
        totalTransactions: number;
        lastTransaction: Date;
    }[]>;
    getAccountSummary(accountId: Types.ObjectId): Promise<{
        _id: TransactionType;
        total: number;
        count: number;
    }[]>;
}
export declare const Transaction: ITransactionModel;
//# sourceMappingURL=Transaction.d.ts.map