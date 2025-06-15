import mongoose, { Document } from 'mongoose';
import { ILoanPayment } from './LoanPayment';
export declare enum LoanStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED"
}
export declare enum LoanType {
    PERSONAL = "PERSONAL",
    BUSINESS = "BUSINESS",
    EMERGENCY = "EMERGENCY",
    EDUCATION = "EDUCATION"
}
export interface ILoan extends Document {
    memberId: mongoose.Types.ObjectId;
    loanType: LoanType;
    loanNumber: string;
    principalAmount: number;
    monthlyInterestRate: number;
    status: LoanStatus;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    calculateOutstandingBalance(): Promise<number>;
    getPaymentHistory(): Promise<ILoanPayment[]>;
}
export interface ILoanModel extends mongoose.Model<ILoan> {
    generateLoanNumber(): Promise<string>;
    findByMember(memberId: string): mongoose.Query<ILoan[], ILoan>;
    findActiveLoans(): mongoose.Query<ILoan[], ILoan>;
    findOverdueLoans(): mongoose.Query<ILoan[], ILoan>;
    getLoanSummary(memberId?: string): Promise<{
        totalLoans: number;
        activeLoans: number;
        completedLoans: number;
        defaultedLoans: number;
        suspendedLoans: number;
        totalPrincipalAmount: number;
    }>;
}
declare const Loan: ILoanModel;
export { Loan };
export default Loan;
//# sourceMappingURL=Loan.d.ts.map