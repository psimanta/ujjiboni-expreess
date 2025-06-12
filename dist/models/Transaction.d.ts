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
    enteredBy: string;
    transactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
    getFormattedAmount(): string;
}
export interface ITransactionModel extends Model<ITransaction> {
    findByAccount(accountId: Types.ObjectId): Promise<ITransaction[]>;
    findByType(type: TransactionType): Promise<ITransaction[]>;
    getAccountBalance(accountId: Types.ObjectId): Promise<any[]>;
    getAccountSummary(accountId: Types.ObjectId): Promise<any[]>;
}
export declare const Transaction: ITransactionModel;
//# sourceMappingURL=Transaction.d.ts.map