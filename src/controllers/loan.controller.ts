import { Request, Response } from 'express';
import { Loan, LoanPayment, User, LoanStatus, LoanType, ILoan } from '../models';
import { FilterQuery } from 'mongoose';

export class LoanController {
  // Create a new loan (admin only)
  async createLoan(req: Request, res: Response): Promise<void> {
    try {
      const { memberId, loanType, principalAmount, monthlyInterestRate, notes } = req.body;

      // Validate required fields
      if (!memberId || !principalAmount || !monthlyInterestRate) {
        res.status(400).json({
          success: false,
          message:
            'Member ID, principal amount, interest rate, loan term, and purpose are required',
        });
        return;
      }

      // Validate member exists and has MEMBER role
      const member = await User.findById(memberId);
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

      // Generate loan number
      const loanNumber = await Loan.generateLoanNumber();
      console.log('loanNumber', loanNumber);

      // Create loan
      const loan = new Loan({
        memberId,
        loanNumber,
        loanType: loanType || LoanType.PERSONAL,
        principalAmount,
        monthlyInterestRate,
        notes,
        createdBy: req.user?._id,
        status: LoanStatus.ACTIVE,
      });

      await loan.save();

      // Populate references for response
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
    } catch (error) {
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

  // Get all loans with filtering and pagination
  async getLoans(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as LoanStatus;
      const memberId = req.query.memberId as string;
      const loanType = req.query.loanType as LoanType;
      const search = req.query.search as string;

      // Build query
      const query: FilterQuery<ILoan> = {};

      if (status && Object.values(LoanStatus).includes(status)) {
        query.status = status;
      }

      if (memberId) {
        query.memberId = memberId;
      }

      if (loanType && Object.values(LoanType).includes(loanType)) {
        query.loanType = loanType;
      }

      if (search) {
        query.$or = [
          { loanNumber: { $regex: search, $options: 'i' } },
          { purpose: { $regex: search, $options: 'i' } },
        ];
      }

      // Calculate skip
      const skip = (page - 1) * limit;

      // Get loans with pagination
      const [loans, total] = await Promise.all([
        Loan.find(query)
          .populate('memberId', 'fullName email')
          .populate('createdBy', 'fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Loan.countDocuments(query),
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
    } catch (error) {
      console.error('Get loans error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching loans',
      });
    }
  }

  // Get loan by ID
  async getLoanById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const loan = await Loan.findById(id)
        .populate('memberId', 'fullName email')
        .populate('createdBy', 'fullName email');

      if (!loan) {
        res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
        return;
      }

      // Calculate additional loan details
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
    } catch (error) {
      console.error('Get loan by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching loan',
      });
    }
  }

  // Update loan
  async updateLoan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes, status } = req.body;

      const loan = await Loan.findById(id);
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

      if (status && Object.values(LoanStatus).includes(status)) {
        loan.status = status;
      }

      await loan.save();

      // Populate references for response
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
    } catch (error) {
      console.error('Update loan error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during loan update',
      });
    }
  }

  // Record principal payment for loan
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;
      const { paymentDate, amount, notes } = req.body;

      // Validate required fields
      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid payment amount is required',
        });
        return;
      }

      // Find loan
      const loan = await Loan.findById(loanId);
      if (!loan) {
        res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
        return;
      }

      if (loan.status !== LoanStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          message: 'Payments can only be recorded for active loans',
        });
        return;
      }

      // Calculate outstanding balance before payment
      const outstandingBalanceBefore = await loan.calculateOutstandingBalance();

      // Validate principal payment amount
      const paymentAmount = amount;

      if (amount > outstandingBalanceBefore) {
        res.status(400).json({
          success: false,
          message: 'Principal payment cannot exceed outstanding balance',
        });
        return;
      }

      // Calculate outstanding balance after payment
      const outstandingBalanceAfter = Math.max(0, outstandingBalanceBefore - paymentAmount);

      // Create payment record (now only for principal payments)
      const payment = new LoanPayment({
        loanId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        amount: paymentAmount,
        outstandingBalanceAfter,
        enteredBy: req.user?._id?.toString(),
        notes,
      });

      await payment.save();

      // Update loan status if fully paid
      if (outstandingBalanceAfter === 0) {
        loan.status = LoanStatus.COMPLETED;
        await loan.save();
      }

      // Populate references for response
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
    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during payment recording',
      });
    }
  }

  // Get loan payments
  async getLoanPayments(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify loan exists
      const loan = await Loan.findById(loanId);
      if (!loan) {
        res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
        return;
      }

      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        LoanPayment.find({ loanId })
          .populate('enteredBy', 'fullName email')
          .sort({ paymentDate: -1 })
          .skip(skip)
          .limit(limit),
        LoanPayment.countDocuments({ loanId }),
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
    } catch (error) {
      console.error('Get loan payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching payments',
      });
    }
  }

  // Get loan statistics
  async getLoanStats(req: Request, res: Response): Promise<void> {
    try {
      const memberId = req.query.memberId as string;

      const loanSummary = await Loan.getLoanSummary(memberId);
      const paymentSummary = await LoanPayment.getPaymentSummary(undefined, memberId);

      res.status(200).json({
        success: true,
        data: {
          loanSummary,
          paymentSummary,
        },
      });
    } catch (error) {
      console.error('Get loan stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching loan statistics',
      });
    }
  }

  // Get member's loans (for members to view their own loans)
  async getMemberLoans(req: Request, res: Response): Promise<void> {
    try {
      const memberId = req.user?.role === 'ADMIN' ? req.params.memberId : req.user?._id?.toString();

      const loans = await Loan.findByMember(memberId as string);

      // Calculate additional details for each loan
      const loansWithDetails = await Promise.all(
        loans.map(async loan => {
          const outstandingBalance = await loan.calculateOutstandingBalance();

          return {
            ...loan.toJSON(),
            outstandingBalance,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          loans: loansWithDetails,
        },
      });
    } catch (error) {
      console.error('Get member loans error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching member loans',
      });
    }
  }
}

export default new LoanController();
