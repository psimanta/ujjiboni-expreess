import { Document } from 'mongoose';
export interface IAccount extends Document {
    name: string;
    accountHolder: string;
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
    lock(): Promise<IAccount>;
    unlock(): Promise<IAccount>;
}
export declare const Account: import("mongoose").Model<IAccount, {}, {}, {}, Document<unknown, {}, IAccount, {}> & IAccount & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Accounts.d.ts.map