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
    paymentDate?: Date;
    penaltyAmount: number;
    interestAmount: number;
    dueAmount: number;
    paidAmount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IInterestPaymentModel extends mongoose.Model<IInterestPayment> {
    findByLoan(loanId: string): mongoose.Query<IInterestPayment[], IInterestPayment>;
    getPaymentSummary(loanId?: string): Promise<{
        totalPayments: number;
        totalDueAmount: number;
        totalPaidAmount: number;
    }>;
    generateMonthlyInterest(loanId: string): Promise<IInterestPayment>;
}
declare const InterestPayment: IInterestPaymentModel;
export { InterestPayment };
export default InterestPayment;
//# sourceMappingURL=InterestPayment.d.ts.map