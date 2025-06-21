"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInterestPayment = exports.getInterestPaymentById = exports.getInterestPaymentSummary = exports.getMemberInterestPayments = exports.getLoanInterestPayments = exports.recordInterestPayment = void 0;
const models_1 = require("../models");
const recordInterestPayment = async (req, res) => {
    try {
        const { loan } = req.params;
        const { paidAmount, penaltyAmount = 0, paymentDate, interestAmount, previousInterestDue, dueAfterInterestPayment, } = req.body;
        const loanExists = await models_1.Loan.findById(loan);
        if (!loanExists) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }
        if (loanExists.status !== models_1.LoanStatus.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: 'Loan is not active',
            });
        }
        const outstandingBalance = await loanExists.calculateOutstandingBalance();
        const currentInterest = (outstandingBalance * loanExists.monthlyInterestRate) / 100;
        const interestPaymentSummary = await models_1.InterestPayment.getPaymentSummary(loan);
        const totalDue = interestPaymentSummary.totalInterest -
            interestPaymentSummary.totalPaidAmount +
            currentInterest +
            penaltyAmount;
        if (paidAmount > totalDue) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount exceeds total due amount',
            });
        }
        const interestPayment = new models_1.InterestPayment({
            loanId: loanExists._id,
            paidAmount,
            penaltyAmount,
            paymentDate,
            interestAmount,
            previousInterestDue,
            dueAfterInterestPayment,
            enteredBy: req.user?._id,
        });
        await interestPayment.save();
        await interestPayment.populate('loanId', 'loanNumber principalAmount interestRate');
        await interestPayment.populate('enteredBy', 'fullName email');
        return res.json({
            success: true,
            message: 'Interest payment recorded successfully',
            interestPayment,
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
        return res.status(500).json({
            success: false,
            message: 'Internal server error during loan creation',
        });
    }
};
exports.recordInterestPayment = recordInterestPayment;
const getLoanInterestPayments = async (req, res) => {
    try {
        const { loan } = req.params;
        const query = { loanId: loan };
        const [interests] = await Promise.all([
            models_1.InterestPayment.find(query)
                .populate('loanId', 'loanNumber principalAmount interestRate')
                .populate('enteredBy', 'fullName email')
                .sort({ createdAt: -1 })
                .limit(100),
        ]);
        const result = {
            totalPayments: 0,
            totalInterest: 0,
            totalPaidAmount: 0,
        };
        interests.forEach(interest => {
            result.totalPayments += 1;
            result.totalInterest += interest.interestAmount;
            result.totalPaidAmount += interest.paidAmount;
        });
        res.json({
            success: true,
            interests,
            paymentSummary: result,
        });
    }
    catch (error) {
        console.error('Error fetching interest payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interest payments',
        });
    }
};
exports.getLoanInterestPayments = getLoanInterestPayments;
const getMemberInterestPayments = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const memberLoans = await models_1.Loan.find({ memberId }).select('_id');
        const loanIds = memberLoans.map(loan => loan._id);
        const query = { loanId: { $in: loanIds } };
        if (status) {
            query.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            models_1.InterestPayment.find(query)
                .populate('loanId', 'loanNumber principalAmount interestRate')
                .populate('enteredBy', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            models_1.InterestPayment.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalItems: total,
                    itemsPerPage: Number(limit),
                },
            },
        });
    }
    catch (error) {
        console.error('Error fetching member interest payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch member interest payments',
        });
    }
};
exports.getMemberInterestPayments = getMemberInterestPayments;
const getInterestPaymentSummary = async (req, res) => {
    try {
        const { loanId } = req.query;
        const summary = await models_1.InterestPayment.getPaymentSummary(loanId);
        res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        console.error('Error fetching interest payment summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interest payment summary',
        });
    }
};
exports.getInterestPaymentSummary = getInterestPaymentSummary;
const getInterestPaymentById = async (req, res) => {
    try {
        const { interestPaymentId } = req.params;
        const payment = await models_1.InterestPayment.findById(interestPaymentId).populate('loanId', 'loanNumber principalAmount interestRate memberId');
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Interest payment not found',
            });
        }
        return res.json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        console.error('Error fetching interest payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch interest payment',
        });
    }
};
exports.getInterestPaymentById = getInterestPaymentById;
const updateInterestPayment = async (req, res) => {
    try {
        const { interestPaymentId } = req.params;
        const updates = req.body;
        const restrictedFields = ['loanId', 'paymentNumber', 'dueAmount'];
        restrictedFields.forEach(field => delete updates[field]);
        const payment = await models_1.InterestPayment.findByIdAndUpdate(interestPaymentId, updates, {
            new: true,
            runValidators: true,
        })
            .populate('loanId', 'loanNumber principalAmount interestRate')
            .populate('enteredBy', 'fullName email');
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Interest payment not found',
            });
        }
        return res.json({
            success: true,
            message: 'Interest payment updated successfully',
            data: payment,
        });
    }
    catch (error) {
        console.error('Error updating interest payment:', error);
        if (error instanceof Error && error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                message: error.message,
            });
            return;
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to update interest payment',
        });
    }
};
exports.updateInterestPayment = updateInterestPayment;
//# sourceMappingURL=interestPayment.controller.js.map