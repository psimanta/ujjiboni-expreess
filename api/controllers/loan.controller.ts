import { Request, Response } from 'express';
import { Loan, LoanPayment, User, LoanStatus, LoanType, ILoan, InterestPayment } from '../models';
import { FilterQuery } from 'mongoose';

export class LoanController {
  // Create a new loan (admin only)
  async createLoan(req: Request, res: Response): Promise<void> {
    try {
      const {
        memberId,
        loanType,
        principalAmount,
        monthlyInterestRate,
        notes,
        interestStartMonth,
        loanDisbursementMonth,
      } = req.body;

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

      // Generate loan number
      const loanNumber = await Loan.generateLoanNumber();

      // Create loan
      const loan = new Loan({
        memberId,
        loanNumber,
        loanType: loanType || LoanType.PERSONAL,
        principalAmount,
        monthlyInterestRate,
        notes,
        interestStartMonth,
        enteredBy: req.user?._id,
        status: LoanStatus.ACTIVE,
        loanDisbursementMonth,
      });

      await loan.save();

      // Populate references for response
      await loan.populate([
        { path: 'memberId', select: 'fullName email' },
        { path: 'enteredBy', select: 'fullName email' },
      ]);

      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        loan,
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
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      // Calculate skip
      const skip = (page - 1) * limit;

      // Get loans with pagination
      const [loans, total] = await Promise.all([
        Loan.find(query)
          .populate('memberId', 'fullName email')
          .populate('enteredBy', 'fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Loan.countDocuments(query),
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
        .populate('enteredBy', 'fullName email');

      if (!loan) {
        res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
        return;
      }

      // Calculate additional loan details
      const outstandingBalance = await loan.calculateOutstandingBalance();

      res.status(200).json({
        success: true,
        loan,
        outstandingBalance,
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
        { path: 'enteredBy', select: 'fullName email' },
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
      const { loan } = req.params;
      const { paymentDate, amount, notes } = req.body;

      // Validate required fields
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

      // Find loan
      const loanExists = await Loan.findById(loan);
      if (!loanExists) {
        res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
        return;
      }

      if (loanExists.status !== LoanStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          message: 'Payments can only be recorded for active loans',
        });
        return;
      }

      // Calculate outstanding balance before payment
      const outstandingBalanceBefore = await loanExists.calculateOutstandingBalance();

      // Validate principal payment amount
      if (amount > outstandingBalanceBefore) {
        res.status(400).json({
          success: false,
          message: 'Principal payment cannot exceed outstanding balance',
        });
        return;
      }

      // Create payment record (now only for principal payments)
      const payment = new LoanPayment({
        loan,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        amount,
        enteredBy: req.user?._id?.toString(),
        notes,
      });

      await payment.save();

      // Update loan status if fully paid
      if (amount === outstandingBalanceBefore) {
        loanExists.status = LoanStatus.COMPLETED;
        await loanExists.save();
      }

      // Populate references for response
      await payment.populate([
        { path: 'loan', select: 'loanNumber principalAmount interestRate' },
        { path: 'enteredBy', select: 'fullName email' },
      ]);

      res.status(201).json({
        success: true,
        message: 'Principal payment recorded successfully',
        payment,
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
      const { loan } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify loan exists
      const loanExists = await Loan.findById(loan);
      if (!loanExists) {
        res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
        return;
      }

      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        LoanPayment.find({ loan })
          .populate('enteredBy', 'fullName email')
          .sort({ paymentDate: -1 })
          .skip(skip)
          .limit(limit),
        LoanPayment.countDocuments({ loan }),
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
    } catch (error) {
      console.error('Get loan payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching payments',
      });
    }
  }

  // Get member's loans (for members to view their own loans)
  async getMemberLoans(req: Request, res: Response): Promise<void> {
    try {
      const memberId = req.user?._id?.toString();

      const loans = await Loan.findByMember(memberId as string);

      // Calculate additional details for each loan
      const loansWithDetails = await Promise.all(
        loans.map(async loan => {
          const outstandingBalance = await loan.calculateOutstandingBalance();
          const interestPaymentSummary = await InterestPayment.getPaymentSummary(
            loan._id.toString()
          );

          return {
            ...loan.toJSON(),
            outstandingBalance,
            interestPaymentSummary,
          };
        })
      );

      res.status(200).json({
        success: true,
        loans: loansWithDetails,
      });
    } catch (error) {
      console.error('Get member loans error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching member loans',
      });
    }
  }

  // Get loan stats
  async getLoanStats(req: Request, res: Response): Promise<void> {
    try {
      // Get basic loan summary using the existing static method
      const loanSummary = await Loan.getLoanSummary();

      // Get all active loans to calculate total outstanding balance
      const activeLoans = await Loan.find({ status: LoanStatus.ACTIVE });

      // Calculate total outstanding balance for active loans
      let totalOutstandingBalance = 0;
      const loanBalances = await Promise.all(
        activeLoans.map(async loan => {
          const outstandingBalance = await loan.calculateOutstandingBalance();
          totalOutstandingBalance += outstandingBalance;
          return {
            loanId: loan._id,
            loanNumber: loan.loanNumber,
            principalAmount: loan.principalAmount,
            outstandingBalance,
          };
        })
      );

      // Get all loans to calculate total due (principal + interest)
      const allLoans = await Loan.find({});

      // Calculate total principal due across all loans
      let totalPrincipalDue = 0;
      await Promise.all(
        allLoans.map(async loan => {
          if (loan.status === LoanStatus.ACTIVE) {
            const outstandingBalance = await loan.calculateOutstandingBalance();
            totalPrincipalDue += outstandingBalance;
          }
        })
      );

      // Get interest payment summary for all loans
      const interestSummary = await InterestPayment.getPaymentSummary();

      // Calculate total interest due (interest amount - paid amount)
      const totalInterestDue = interestSummary.totalInterest - interestSummary.totalPaidAmount;

      // Total due is principal due + interest due
      const totalDue = totalPrincipalDue + Math.max(0, totalInterestDue);

      // Calculate additional statistics
      const averageLoanAmount =
        loanSummary.totalLoans > 0 ? loanSummary.totalPrincipalAmount / loanSummary.totalLoans : 0;

      const recoveryRate =
        loanSummary.totalPrincipalAmount > 0
          ? ((loanSummary.totalPrincipalAmount - totalOutstandingBalance) /
              loanSummary.totalPrincipalAmount) *
            100
          : 0;

      res.status(200).json({
        success: true,
        data: {
          // Basic loan counts and amounts
          totalLoans: loanSummary.totalLoans,
          activeLoans: loanSummary.activeLoans,
          completedLoans: loanSummary.completedLoans,
          totalPrincipalAmount: loanSummary.totalPrincipalAmount,

          // Outstanding balance statistics
          totalOutstandingBalance,
          totalPrincipalDue,

          // Interest statistics
          totalInterestGenerated: interestSummary.totalInterest,
          totalInterestPaid: interestSummary.totalPaidAmount,
          totalInterestDue: Math.max(0, totalInterestDue),

          // Combined totals
          totalDue, // Total principal + interest due

          // Calculated metrics
          averageLoanAmount: Math.round(averageLoanAmount),
          recoveryRate: Math.round(recoveryRate * 100) / 100, // Round to 2 decimal places

          // Detailed breakdown (optional, for admin insights)
          loanBreakdown: {
            activeLoanBalances: loanBalances,
            interestPaymentCount: interestSummary.totalPayments,
          },
        },
        message: 'Loan statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Get loan stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching loan statistics',
      });
    }
  }
}

export default new LoanController();
