import mongoose, { Document } from 'mongoose';
export interface ILoanPayment extends Document {
    loan: mongoose.Types.ObjectId;
    paymentDate: Date;
    amount: number;
    enteredBy: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ILoanPaymentModel extends mongoose.Model<ILoanPayment> {
    findByLoan(loanId: string): mongoose.Query<ILoanPayment[], ILoanPayment>;
    findByMember(memberId: string): mongoose.Query<ILoanPayment[], ILoanPayment>;
    getPaymentSummary(loanId?: string, memberId?: string): Promise<{
        totalPayments: number;
        totalPrincipalPaid: number;
        lastPaymentDate: Date | null;
        firstPaymentDate: Date | null;
        averagePaymentAmount: number;
    }>;
}
declare const LoanPayment: ILoanPaymentModel;
export { LoanPayment };
export default LoanPayment;
//# sourceMappingURL=LoanPayment.d.ts.map