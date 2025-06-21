import mongoose, { Document } from 'mongoose';
export declare enum InterestPaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    PARTIAL = "PARTIAL"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER",
    CHEQUE = "CHEQUE",
    ONLINE = "ONLINE",
    UPI = "UPI"
}
export interface IInterestPayment extends Document {
    loanId: mongoose.Types.ObjectId;
    paymentDate?: string;
    penaltyAmount: number;
    previousInterestDue: number;
    dueAfterInterestPayment: number;
    interestAmount: number;
    paidAmount: number;
    enteredBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IInterestPaymentModel extends mongoose.Model<IInterestPayment> {
    findByLoan(loanId: string): mongoose.Query<IInterestPayment[], IInterestPayment>;
    getPaymentSummary(loanId?: string): Promise<{
        totalPayments: number;
        totalInterest: number;
        totalPaidAmount: number;
    }>;
    generateMonthlyInterest(loanId: string): Promise<IInterestPayment>;
}
declare const InterestPayment: IInterestPaymentModel;
export { InterestPayment };
export default InterestPayment;
//# sourceMappingURL=InterestPayment.d.ts.map