"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanController = void 0;
const models_1 = require("../models");
class LoanController {
    async createLoan(req, res) {
        try {
            const { memberId, loanType, principalAmount, monthlyInterestRate, notes, interestStartMonth, loanDisbursementMonth, } = req.body;
            if (!memberId || !principalAmount || !monthlyInterestRate) {
                res.status(400).json({
                    success: false,
                    message: 'Member ID, principal amount, interest rate, loan term, and purpose are required',
                });
                return;
            }
            const member = await models_1.User.findById(memberId);
            if (!member) {
                res.status(404).json({
                    success: false,
                    message: 'Member not found',
                });
                return;
            }
            const loanNumber = await models_1.Loan.generateLoanNumber();
            const loan = new models_1.Loan({
                memberId,
                loanNumber,
                loanType: loanType || models_1.LoanType.PERSONAL,
                principalAmount,
                monthlyInterestRate,
                notes,
                interestStartMonth,
                enteredBy: req.user?._id,
                status: models_1.LoanStatus.ACTIVE,
                loanDisbursementMonth,
            });
            await loan.save();
            await loan.populate([
                { path: 'memberId', select: 'fullName email' },
                { path: 'enteredBy', select: 'fullName email' },
            ]);
            res.status(201).json({
                success: true,
                message: 'Loan created successfully',
                loan,
            });
        }
        catch (error) {
            if (error instanceof Error && error.name === 'ValidationError') {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: error.message,
                });
                return;
            }
            console.error('Create loan error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during loan creation',
            });
        }
    }
    async getLoans(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;
            const memberId = req.query.memberId;
            const loanType = req.query.loanType;
            const search = req.query.search;
            const query = {};
            if (status && Object.values(models_1.LoanStatus).includes(status)) {
                query.status = status;
            }
            if (memberId) {
                query.memberId = memberId;
            }
            if (loanType && Object.values(models_1.LoanType).includes(loanType)) {
                query.loanType = loanType;
            }
            if (search) {
                query.$or = [
                    { loanNumber: { $regex: search, $options: 'i' } },
                    { notes: { $regex: search, $options: 'i' } },
                ];
            }
            const skip = (page - 1) * limit;
            const [loans, total] = await Promise.all([
                models_1.Loan.find(query)
                    .populate('memberId', 'fullName email')
                    .populate('enteredBy', 'fullName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                models_1.Loan.countDocuments(query),
            ]);
            const pages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                loans,
                pagination: {
                    page,
                    limit,
                    total,
                    pages,
                },
            });
        }
        catch (error) {
            console.error('Get loans error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching loans',
            });
        }
    }
    async getLoanById(req, res) {
        try {
            const { id } = req.params;
            const loan = await models_1.Loan.findById(id)
                .populate('memberId', 'fullName email')
                .populate('enteredBy', 'fullName email');
            if (!loan) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            const outstandingBalance = await loan.calculateOutstandingBalance();
            res.status(200).json({
                success: true,
                loan,
                outstandingBalance,
            });
        }
        catch (error) {
            console.error('Get loan by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching loan',
            });
        }
    }
    async updateLoan(req, res) {
        try {
            const { id } = req.params;
            const { notes, status } = req.body;
            const loan = await models_1.Loan.findById(id);
            if (!loan) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            if (notes !== undefined) {
                loan.notes = notes;
            }
            if (status && Object.values(models_1.LoanStatus).includes(status)) {
                loan.status = status;
            }
            await loan.save();
            await loan.populate([
                { path: 'memberId', select: 'fullName email' },
                { path: 'enteredBy', select: 'fullName email' },
            ]);
            res.status(200).json({
                success: true,
                message: 'Loan updated successfully',
                data: {
                    loan,
                },
            });
        }
        catch (error) {
            console.error('Update loan error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during loan update',
            });
        }
    }
    async recordPayment(req, res) {
        try {
            const { loan } = req.params;
            const { paymentDate, amount, notes } = req.body;
            if (!amount || amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Valid payment amount is required',
                });
                return;
            }
            if (!paymentDate) {
                res.status(400).json({
                    success: false,
                    message: 'Payment date is required',
                });
                return;
            }
            const loanExists = await models_1.Loan.findById(loan);
            if (!loanExists) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            if (loanExists.status !== models_1.LoanStatus.ACTIVE) {
                res.status(400).json({
                    success: false,
                    message: 'Payments can only be recorded for active loans',
                });
                return;
            }
            const outstandingBalanceBefore = await loanExists.calculateOutstandingBalance();
            if (amount > outstandingBalanceBefore) {
                res.status(400).json({
                    success: false,
                    message: 'Principal payment cannot exceed outstanding balance',
                });
                return;
            }
            const payment = new models_1.LoanPayment({
                loan,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                amount,
                enteredBy: req.user?._id?.toString(),
                notes,
            });
            await payment.save();
            if (amount === outstandingBalanceBefore) {
                loanExists.status = models_1.LoanStatus.COMPLETED;
                await loanExists.save();
            }
            await payment.populate([
                { path: 'loan', select: 'loanNumber principalAmount interestRate' },
                { path: 'enteredBy', select: 'fullName email' },
            ]);
            res.status(201).json({
                success: true,
                message: 'Principal payment recorded successfully',
                payment,
            });
        }
        catch (error) {
            console.error('Record payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during payment recording',
            });
        }
    }
    async getLoanPayments(req, res) {
        try {
            const { loan } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const loanExists = await models_1.Loan.findById(loan);
            if (!loanExists) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            const skip = (page - 1) * limit;
            const [payments, total] = await Promise.all([
                models_1.LoanPayment.find({ loan })
                    .populate('enteredBy', 'fullName email')
                    .sort({ paymentDate: -1 })
                    .skip(skip)
                    .limit(limit),
                models_1.LoanPayment.countDocuments({ loan }),
            ]);
            const pages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages,
                },
            });
        }
        catch (error) {
            console.error('Get loan payments error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching payments',
            });
        }
    }
    async getMemberLoans(req, res) {
        try {
            const memberId = req.user?._id?.toString();
            const loans = await models_1.Loan.findByMember(memberId);
            const loansWithDetails = await Promise.all(loans.map(async (loan) => {
                const outstandingBalance = await loan.calculateOutstandingBalance();
                const interestPaymentSummary = await models_1.InterestPayment.getPaymentSummary(loan._id.toString());
                return {
                    ...loan.toJSON(),
                    outstandingBalance,
                    interestPaymentSummary,
                };
            }));
            res.status(200).json({
                success: true,
                loans: loansWithDetails,
            });
        }
        catch (error) {
            console.error('Get member loans error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching member loans',
            });
        }
    }
    async getLoanStats(req, res) {
        try {
            const loanSummary = await models_1.Loan.getLoanSummary();
            const activeLoans = await models_1.Loan.find({ status: models_1.LoanStatus.ACTIVE });
            let totalOutstandingBalance = 0;
            const loanBalances = await Promise.all(activeLoans.map(async (loan) => {
                const outstandingBalance = await loan.calculateOutstandingBalance();
                totalOutstandingBalance += outstandingBalance;
                return {
                    loanId: loan._id,
                    loanNumber: loan.loanNumber,
                    principalAmount: loan.principalAmount,
                    outstandingBalance,
                };
            }));
            const allLoans = await models_1.Loan.find({});
            let totalPrincipalDue = 0;
            await Promise.all(allLoans.map(async (loan) => {
                if (loan.status === models_1.LoanStatus.ACTIVE) {
                    const outstandingBalance = await loan.calculateOutstandingBalance();
                    totalPrincipalDue += outstandingBalance;
                }
            }));
            const interestSummary = await models_1.InterestPayment.getPaymentSummary();
            const totalInterestDue = interestSummary.totalInterest - interestSummary.totalPaidAmount;
            const totalDue = totalPrincipalDue + Math.max(0, totalInterestDue);
            const averageLoanAmount = loanSummary.totalLoans > 0
                ? loanSummary.totalPrincipalAmount / loanSummary.totalLoans
                : 0;
            const recoveryRate = loanSummary.totalPrincipalAmount > 0
                ? ((loanSummary.totalPrincipalAmount - totalOutstandingBalance) / loanSummary.totalPrincipalAmount) * 100
                : 0;
            res.status(200).json({
                success: true,
                data: {
                    totalLoans: loanSummary.totalLoans,
                    activeLoans: loanSummary.activeLoans,
                    completedLoans: loanSummary.completedLoans,
                    totalPrincipalAmount: loanSummary.totalPrincipalAmount,
                    totalOutstandingBalance,
                    totalPrincipalDue,
                    totalInterestGenerated: interestSummary.totalInterest,
                    totalInterestPaid: interestSummary.totalPaidAmount,
                    totalInterestDue: Math.max(0, totalInterestDue),
                    totalDue,
                    averageLoanAmount: Math.round(averageLoanAmount),
                    recoveryRate: Math.round(recoveryRate * 100) / 100,
                    loanBreakdown: {
                        activeLoanBalances: loanBalances,
                        interestPaymentCount: interestSummary.totalPayments,
                    }
                },
                message: 'Loan statistics retrieved successfully'
            });
        }
        catch (error) {
            console.error('Get loan stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching loan statistics',
            });
        }
    }
}
exports.LoanController = LoanController;
exports.default = new LoanController();
//# sourceMappingURL=loan.controller.js.map