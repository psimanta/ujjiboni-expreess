import mongoose, { Document, Types } from 'mongoose';
export declare enum UserRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER"
}
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    fullName: string;
    password?: string;
    role: UserRole;
    lastLogin?: Date;
    isFirstLogin: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    markLogin(): Promise<void>;
    setPassword(newPassword: string): Promise<void>;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export { User };
export default User;
//# sourceMappingURL=User.d.ts.map