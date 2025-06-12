import { Router } from 'express';
import {
  generateInterestPayment,
  recordInterestPayment,
  getLoanInterestPayments,
  getMemberInterestPayments,
  getOverdueInterestPayments,
  getPendingInterestPayments,
  getInterestPaymentSummary,
  getInterestPaymentById,
  updateInterestPayment,
} from '../controllers/interestPayment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Generate monthly interest payment for a loan (Admin only)
router.post('/generate/:loanId', generateInterestPayment);

// Record interest payment
router.post('/record/:interestPaymentId', recordInterestPayment);

// Get interest payments for a specific loan
router.get('/loan/:loanId', getLoanInterestPayments);

// Get interest payments for a specific member
router.get('/member/:memberId', getMemberInterestPayments);

// Get overdue interest payments
router.get('/overdue', getOverdueInterestPayments);

// Get pending interest payments
router.get('/pending', getPendingInterestPayments);

// Get interest payment summary
router.get('/summary', getInterestPaymentSummary);

// Get specific interest payment by ID
router.get('/:interestPaymentId', getInterestPaymentById);

// Update interest payment
router.put('/:interestPaymentId', updateInterestPayment);

export default router;
