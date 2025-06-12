import { Request, Response } from 'express';
import { InterestPayment, Loan, User } from '../models';
import { InterestPaymentStatus } from '../models/InterestPayment';

// Generate monthly interest payment for a loan
export const generateInterestPayment = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;

    // Validate loan exists and is active
    const loan = await Loan.findById(loanId);
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

    // Check if there's already a pending interest payment for this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const existingPayment = await InterestPayment.findOne({
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

    const interestPayment = await InterestPayment.generateMonthlyInterest(loanId);

    return res.status(201).json({
      success: true,
      message: 'Interest payment generated successfully',
      data: interestPayment,
    });
  } catch (error: any) {
    console.error('Error generating interest payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate interest payment',
    });
  }
};

// Record interest payment
export const recordInterestPayment = async (req: Request, res: Response) => {
  try {
    const { interestPaymentId } = req.params;
    const {
      paidAmount,
      paymentMethod,
      receivedBy,
      receiptNumber,
      transactionReference,
      penaltyAmount = 0,
      lateFeeAmount = 0,
      notes,
    } = req.body;

    const interestPayment = await InterestPayment.findById(interestPaymentId);
    if (!interestPayment) {
      return res.status(404).json({
        success: false,
        message: 'Interest payment not found',
      });
    }

    if (interestPayment.status === InterestPaymentStatus.PAID) {
      return res.status(400).json({
        success: false,
        message: 'Interest payment is already fully paid',
      });
    }

    // Validate payment amount
    const totalDue = interestPayment.dueAmount + penaltyAmount + lateFeeAmount;
    const newTotalPaid = interestPayment.paidAmount + paidAmount;

    if (newTotalPaid > totalDue) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds total due amount',
      });
    }

    // Update interest payment
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

    const populatedPayment = await InterestPayment.findById(interestPaymentId)
      .populate('loanId', 'loanNumber principalAmount interestRate')
      .populate('paidBy', 'fullName email')
      .populate('receivedBy', 'fullName email');

    return res.json({
      success: true,
      message: 'Interest payment recorded successfully',
      data: populatedPayment,
    });
  } catch (error: any) {
    console.error('Error recording interest payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record interest payment',
    });
  }
};

// Get interest payments for a loan
export const getLoanInterestPayments = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { loanId };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      InterestPayment.find(query)
        .populate('loanId', 'loanNumber principalAmount interestRate')
        .populate('paidBy', 'fullName email')
        .populate('receivedBy', 'fullName email')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InterestPayment.countDocuments(query),
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
  } catch (error: any) {
    console.error('Error fetching interest payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch interest payments',
    });
  }
};

// Get member's interest payments
export const getMemberInterestPayments = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Find all loans for the member
    const memberLoans = await Loan.find({ memberId }).select('_id');
    const loanIds = memberLoans.map(loan => loan._id);

    const query: any = { loanId: { $in: loanIds } };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      InterestPayment.find(query)
        .populate('loanId', 'loanNumber principalAmount interestRate')
        .populate('paidBy', 'fullName email')
        .populate('receivedBy', 'fullName email')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InterestPayment.countDocuments(query),
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
  } catch (error: any) {
    console.error('Error fetching member interest payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch member interest payments',
    });
  }
};

// Get overdue interest payments
export const getOverdueInterestPayments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      InterestPayment.findOverduePayments().skip(skip).limit(Number(limit)),
      InterestPayment.countDocuments({
        status: { $in: [InterestPaymentStatus.OVERDUE, InterestPaymentStatus.PARTIAL] },
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
  } catch (error: any) {
    console.error('Error fetching overdue interest payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch overdue interest payments',
    });
  }
};

// Get pending interest payments
export const getPendingInterestPayments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      InterestPayment.findPendingPayments().skip(skip).limit(Number(limit)),
      InterestPayment.countDocuments({
        status: { $in: [InterestPaymentStatus.PENDING, InterestPaymentStatus.PARTIAL] },
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
  } catch (error: any) {
    console.error('Error fetching pending interest payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending interest payments',
    });
  }
};

// Get interest payment summary
export const getInterestPaymentSummary = async (req: Request, res: Response) => {
  try {
    const { loanId, memberId } = req.query;

    const summary = await InterestPayment.getPaymentSummary(loanId as string, memberId as string);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching interest payment summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch interest payment summary',
    });
  }
};

// Get interest payment by ID
export const getInterestPaymentById = async (req: Request, res: Response) => {
  try {
    const { interestPaymentId } = req.params;

    const payment = await InterestPayment.findById(interestPaymentId)
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
  } catch (error: any) {
    console.error('Error fetching interest payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch interest payment',
    });
  }
};

// Update interest payment
export const updateInterestPayment = async (req: Request, res: Response) => {
  try {
    const { interestPaymentId } = req.params;
    const updates = req.body;

    // Prevent updating certain fields
    const restrictedFields = [
      'loanId',
      'paymentNumber',
      'dueAmount',
      'outstandingBalance',
      'interestRate',
      'monthlyInterestRate',
    ];
    restrictedFields.forEach(field => delete updates[field]);

    const payment = await InterestPayment.findByIdAndUpdate(interestPaymentId, updates, {
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
  } catch (error: any) {
    console.error('Error updating interest payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update interest payment',
    });
  }
};
