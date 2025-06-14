import { Router } from 'express';
import loanController from '../controllers/loan.controller';
import { authenticate, requireMemberOnly } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication

// Admin-only routes
router.post('/', [authenticate, requireMemberOnly], loanController.createLoan); // Create loan
router.get('/', [authenticate], loanController.getLoans); // Get all loans with filtering
router.get('/stats', [authenticate], loanController.getLoanStats); // Get loan statistics
router.put('/:id', [authenticate, requireMemberOnly], loanController.updateLoan); // Update loan

// Admin and member routes (members can view their own loans)
router.get('/member/:memberId?', [authenticate], loanController.getMemberLoans); // Get member's loans
router.get('/:id', [authenticate], loanController.getLoanById); // Get loan by ID

// Payment routes (members can record payments)
router.post('/:loanId/payments', [authenticate, requireMemberOnly], loanController.recordPayment); // Record payment
router.get('/:loanId/payments', [authenticate], loanController.getLoanPayments); // Get loan payments

export default router;
