import { Router } from 'express';
import loanController from '../controllers/loan.controller';
import { authenticate, requireMemberOnly } from '../middleware/auth.middleware';
import {
  recordInterestPayment,
  getLoanInterestPayments,
  //   getMemberInterestPayments,
  //   getInterestPaymentSummary,
  //   getInterestPaymentById,
  //   updateInterestPayment,
} from '../controllers/interestPayment.controller';

const router = Router();

// All routes require authentication

// Admin-only routes
router.post('/', [authenticate, requireMemberOnly], loanController.createLoan); // Create loan
router.get('/', [authenticate], loanController.getLoans); // Get all loans with filtering
router.put('/:id', [authenticate, requireMemberOnly], loanController.updateLoan); // Update loan
router.get('/stats', [authenticate], loanController.getLoanStats); // Get loan stats

// Admin and member routes (members can view their own loans)
router.get('/member/stats', [authenticate], loanController.getMemberLoans); // Get member's loans
router.get('/:id', [authenticate], loanController.getLoanById); // Get loan by ID

// Payment routes (members can record payments)
router.post('/:loan/payments', [authenticate, requireMemberOnly], loanController.recordPayment); // Record payment
router.get('/:loan/payments', [authenticate], loanController.getLoanPayments); // Get loan payments

router.post('/:loan/interests', [authenticate, requireMemberOnly], recordInterestPayment);
router.get('/:loan/interests', [authenticate], getLoanInterestPayments);

export default router;
