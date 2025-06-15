"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanController = void 0;
const models_1 = require("../models");
class LoanController {
    async createLoan(req, res) {
        try {
            const { memberId, loanType, principalAmount, monthlyInterestRate, notes } = req.body;
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
            if (member.role !== 'MEMBER') {
                res.status(400).json({
                    success: false,
                    message: 'Loans can only be created for members',
                });
                return;
            }
            const loanNumber = await models_1.Loan.generateLoanNumber();
            console.log('loanNumber', loanNumber);
            const loan = new models_1.Loan({
                memberId,
                loanNumber,
                loanType: loanType || models_1.LoanType.PERSONAL,
                principalAmount,
                monthlyInterestRate,
                notes,
                createdBy: req.user?._id,
                status: models_1.LoanStatus.ACTIVE,
            });
            await loan.save();
            await loan.populate([
                { path: 'memberId', select: 'fullName email' },
                { path: 'createdBy', select: 'fullName email' },
            ]);
            res.status(201).json({
                success: true,
                message: 'Loan created successfully',
                data: {
                    loan,
                },
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
                    { purpose: { $regex: search, $options: 'i' } },
                ];
            }
            const skip = (page - 1) * limit;
            const [loans, total] = await Promise.all([
                models_1.Loan.find(query)
                    .populate('memberId', 'fullName email')
                    .populate('createdBy', 'fullName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                models_1.Loan.countDocuments(query),
            ]);
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                data: {
                    loans,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
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
                .populate('createdBy', 'fullName email');
            if (!loan) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            const outstandingBalance = await loan.calculateOutstandingBalance();
            const paymentHistory = await loan.getPaymentHistory();
            res.status(200).json({
                success: true,
                data: {
                    loan,
                    outstandingBalance,
                    paymentHistory,
                },
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
                { path: 'createdBy', select: 'fullName email' },
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
            const { loanId } = req.params;
            const { paymentDate, amount, notes } = req.body;
            if (!amount || amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Valid payment amount is required',
                });
                return;
            }
            const loan = await models_1.Loan.findById(loanId);
            if (!loan) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            if (loan.status !== models_1.LoanStatus.ACTIVE) {
                res.status(400).json({
                    success: false,
                    message: 'Payments can only be recorded for active loans',
                });
                return;
            }
            const outstandingBalanceBefore = await loan.calculateOutstandingBalance();
            const paymentAmount = amount;
            if (amount > outstandingBalanceBefore) {
                res.status(400).json({
                    success: false,
                    message: 'Principal payment cannot exceed outstanding balance',
                });
                return;
            }
            const outstandingBalanceAfter = Math.max(0, outstandingBalanceBefore - paymentAmount);
            const payment = new models_1.LoanPayment({
                loanId,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                amount: paymentAmount,
                outstandingBalanceAfter,
                enteredBy: req.user?._id?.toString(),
                notes,
            });
            await payment.save();
            if (outstandingBalanceAfter === 0) {
                loan.status = models_1.LoanStatus.COMPLETED;
                await loan.save();
            }
            await payment.populate([
                { path: 'loanId', select: 'loanNumber principalAmount interestRate' },
                { path: 'enteredBy', select: 'fullName email' },
            ]);
            res.status(201).json({
                success: true,
                message: 'Principal payment recorded successfully',
                data: {
                    payment,
                    outstandingBalanceAfter,
                    loanCompleted: outstandingBalanceAfter === 0,
                },
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
            const { loanId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const loan = await models_1.Loan.findById(loanId);
            if (!loan) {
                res.status(404).json({
                    success: false,
                    message: 'Loan not found',
                });
                return;
            }
            const skip = (page - 1) * limit;
            const [payments, total] = await Promise.all([
                models_1.LoanPayment.find({ loanId })
                    .populate('enteredBy', 'fullName email')
                    .sort({ paymentDate: -1 })
                    .skip(skip)
                    .limit(limit),
                models_1.LoanPayment.countDocuments({ loanId }),
            ]);
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                data: {
                    payments,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1,
                    },
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
    async getLoanStats(req, res) {
        try {
            const memberId = req.query.memberId;
            const loanSummary = await models_1.Loan.getLoanSummary(memberId);
            const paymentSummary = await models_1.LoanPayment.getPaymentSummary(undefined, memberId);
            res.status(200).json({
                success: true,
                data: {
                    loanSummary,
                    paymentSummary,
                },
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
    async getMemberLoans(req, res) {
        try {
            const memberId = req.user?.role === 'ADMIN' ? req.params.memberId : req.user?._id?.toString();
            const loans = await models_1.Loan.findByMember(memberId);
            const loansWithDetails = await Promise.all(loans.map(async (loan) => {
                const outstandingBalance = await loan.calculateOutstandingBalance();
                return {
                    ...loan.toJSON(),
                    outstandingBalance,
                };
            }));
            res.status(200).json({
                success: true,
                data: {
                    loans: loansWithDetails,
                },
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
}
exports.LoanController = LoanController;
exports.default = new LoanController();
//# sourceMappingURL=loan.controller.js.map