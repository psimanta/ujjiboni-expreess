"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInterestPayment = exports.getInterestPaymentById = exports.getInterestPaymentSummary = exports.getPendingInterestPayments = exports.getOverdueInterestPayments = exports.getMemberInterestPayments = exports.getLoanInterestPayments = exports.recordInterestPayment = exports.generateInterestPayment = void 0;
const models_1 = require("../models");
const InterestPayment_1 = require("../models/InterestPayment");
const generateInterestPayment = async (req, res) => {
    try {
        const { loanId } = req.params;
        const loan = await models_1.Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }
        if (loan.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Interest can only be generated for active loans',
            });
        }
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const existingPayment = await models_1.InterestPayment.findOne({
            loanId,
            dueDate: {
                $gte: new Date(currentYear, currentMonth, 1),
                $lt: new Date(currentYear, currentMonth + 1, 1),
            },
        });
        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Interest payment for this month already exists',
                data: existingPayment,
            });
        }
        const interestPayment = await models_1.InterestPayment.generateMonthlyInterest(loanId);
        return res.status(201).json({
            success: true,
            message: 'Interest payment generated successfully',
            data: interestPayment,
        });
    }
    catch (error) {
        console.error('Error generating interest payment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate interest payment',
        });
    }
};
exports.generateInterestPayment = generateInterestPayment;
const recordInterestPayment = async (req, res) => {
    try {
        const { interestPaymentId } = req.params;
        const { paidAmount, paymentMethod, receivedBy, receiptNumber, transactionReference, penaltyAmount = 0, lateFeeAmount = 0, notes, } = req.body;
        const interestPayment = await models_1.InterestPayment.findById(interestPaymentId);
        if (!interestPayment) {
            return res.status(404).json({
                success: false,
                message: 'Interest payment not found',
            });
        }
        if (interestPayment.status === InterestPayment_1.InterestPaymentStatus.PAID) {
            return res.status(400).json({
                success: false,
                message: 'Interest payment is already fully paid',
            });
        }
        const totalDue = interestPayment.dueAmount + penaltyAmount + lateFeeAmount;
        const newTotalPaid = interestPayment.paidAmount + paidAmount;
        if (newTotalPaid > totalDue) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount exceeds total due amount',
            });
        }
        interestPayment.paidAmount = newTotalPaid;
        interestPayment.paymentMethod = paymentMethod;
        interestPayment.receivedBy = receivedBy;
        interestPayment.receiptNumber = receiptNumber;
        interestPayment.transactionReference = transactionReference;
        interestPayment.penaltyAmount = (interestPayment.penaltyAmount || 0) + penaltyAmount;
        interestPayment.lateFeeAmount = (interestPayment.lateFeeAmount || 0) + lateFeeAmount;
        if (notes) {
            interestPayment.notes = notes;
        }
        await interestPayment.save();
        const populatedPayment = await models_1.InterestPayment.findById(interestPaymentId)
            .populate('loanId', 'loanNumber principalAmount interestRate')
            .populate('paidBy', 'fullName email')
            .populate('receivedBy', 'fullName email');
        return res.json({
            success: true,
            message: 'Interest payment recorded successfully',
            data: populatedPayment,
        });
    }
    catch (error) {
        console.error('Error recording interest payment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to record interest payment',
        });
    }
};
exports.recordInterestPayment = recordInterestPayment;
const getLoanInterestPayments = async (req, res) => {
    try {
        const { loanId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const query = { loanId };
        if (status) {
            query.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            models_1.InterestPayment.find(query)
                .populate('loanId', 'loanNumber principalAmount interestRate')
                .populate('paidBy', 'fullName email')
                .populate('receivedBy', 'fullName email')
                .sort({ dueDate: -1 })
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
        console.error('Error fetching interest payments:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch interest payments',
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
                .populate('paidBy', 'fullName email')
                .populate('receivedBy', 'fullName email')
                .sort({ dueDate: -1 })
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
            message: error.message || 'Failed to fetch member interest payments',
        });
    }
};
exports.getMemberInterestPayments = getMemberInterestPayments;
const getOverdueInterestPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            models_1.InterestPayment.findOverduePayments().skip(skip).limit(Number(limit)),
            models_1.InterestPayment.countDocuments({
                status: { $in: [InterestPayment_1.InterestPaymentStatus.OVERDUE, InterestPayment_1.InterestPaymentStatus.PARTIAL] },
                dueDate: { $lt: new Date() },
            }),
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
        console.error('Error fetching overdue interest payments:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch overdue interest payments',
        });
    }
};
exports.getOverdueInterestPayments = getOverdueInterestPayments;
const getPendingInterestPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            models_1.InterestPayment.findPendingPayments().skip(skip).limit(Number(limit)),
            models_1.InterestPayment.countDocuments({
                status: { $in: [InterestPayment_1.InterestPaymentStatus.PENDING, InterestPayment_1.InterestPaymentStatus.PARTIAL] },
            }),
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
        console.error('Error fetching pending interest payments:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch pending interest payments',
        });
    }
};
exports.getPendingInterestPayments = getPendingInterestPayments;
const getInterestPaymentSummary = async (req, res) => {
    try {
        const { loanId, memberId } = req.query;
        const summary = await models_1.InterestPayment.getPaymentSummary(loanId, memberId);
        res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        console.error('Error fetching interest payment summary:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch interest payment summary',
        });
    }
};
exports.getInterestPaymentSummary = getInterestPaymentSummary;
const getInterestPaymentById = async (req, res) => {
    try {
        const { interestPaymentId } = req.params;
        const payment = await models_1.InterestPayment.findById(interestPaymentId)
            .populate('loanId', 'loanNumber principalAmount interestRate memberId')
            .populate('paidBy', 'fullName email')
            .populate('receivedBy', 'fullName email');
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
            message: error.message || 'Failed to fetch interest payment',
        });
    }
};
exports.getInterestPaymentById = getInterestPaymentById;
const updateInterestPayment = async (req, res) => {
    try {
        const { interestPaymentId } = req.params;
        const updates = req.body;
        const restrictedFields = [
            'loanId',
            'paymentNumber',
            'dueAmount',
            'outstandingBalance',
            'interestRate',
            'monthlyInterestRate',
        ];
        restrictedFields.forEach(field => delete updates[field]);
        const payment = await models_1.InterestPayment.findByIdAndUpdate(interestPaymentId, updates, {
            new: true,
            runValidators: true,
        })
            .populate('loanId', 'loanNumber principalAmount interestRate')
            .populate('paidBy', 'fullName email')
            .populate('receivedBy', 'fullName email');
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
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update interest payment',
        });
    }
};
exports.updateInterestPayment = updateInterestPayment;
//# sourceMappingURL=interestPayment.controller.js.map