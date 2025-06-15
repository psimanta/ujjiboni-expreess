import { Document, Types, Model } from 'mongoose';
export declare enum AccountType {
    CASH = "cash",
    SAVINGS = "savings",
    FDR = "fdr",
    DPS = "dps",
    SHANCHAYPATRA = "shanchaypatra",
    OTHER = "other"
}
export interface IAccount extends Document {
    name: string;
    type: AccountType;
    accountHolder: Types.ObjectId;
    isLocked: boolean;
    balance: number;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    lock(): Promise<IAccount>;
    unlock(): Promise<IAccount>;
    updateBalance(amount: number): Promise<IAccount>;
}
export interface IAccountModel extends Model<IAccount> {
    findAccountsWithBalance(matchStage: Record<string, string>): Promise<IAccount[]>;
}
export declare const Account: IAccountModel;
//# sourceMappingURL=Accounts.d.ts.map